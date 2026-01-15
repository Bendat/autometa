import { access, readdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";

import { Config } from "@autometa/config";
import type { ResolvedConfig } from "@autometa/config";

import { loadModule, type ModuleLoadOptions } from "./module-loader";

export interface LoadedExecutorConfig {
  readonly filePath: string;
  readonly config: Config;
  readonly resolved: ResolvedConfig;
}

export interface LoadExecutorConfigOptions {
  readonly configPath?: string;
  readonly cacheDir?: string;
  readonly external?: readonly string[];
  readonly modules?: readonly string[];
  readonly groups?: readonly string[];
  readonly environment?: string;
}

const CONFIG_EXTENSIONS = ["ts", "mts", "cts", "js", "mjs", "cjs"] as const;

/**
 * Return candidate filenames for a given directory, following patterns similar to Vitest/Jest:
 * - autometa.config.{ts,mts,cts,js,mjs,cjs}
 * - autometa.<name>.config.{ts,mts,cts,js,mjs,cjs} (e.g. autometa.e2e.config.ts)
 * Preference order:
 *  1) Plain name (autometa.config.*)
 *  2) Shortest named variant (autometa.<name>.config.*)
 */
async function findConfigInDir(dir: string): Promise<string | undefined> {
  // First, prefer the plain name variants
  for (const ext of CONFIG_EXTENSIONS) {
    const candidate = resolvePath(dir, `autometa.config.${ext}`);
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  // Then, search the directory for named variants: autometa.<name>.config.<ext>
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    // Collect matching files and sort deterministically
    const matches: string[] = [];
    const pattern = /^autometa\.[A-Za-z0-9_-]+\.config\.(?:ts|mts|cts|js|mjs|cjs)$/u;
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (pattern.test(entry.name)) {
        matches.push(resolvePath(dir, entry.name));
      }
    }
    if (matches.length > 0) {
      // Prefer shortest filename (i.e., shortest <name>), then alphabetically to stabilize
      matches.sort((a, b) => {
        const an = a.split("/").pop() ?? a;
        const bn = b.split("/").pop() ?? b;
        const alen = an.length;
        const blen = bn.length;
        return alen === blen ? an.localeCompare(bn) : alen - blen;
      });
      return matches[0];
    }
  } catch {
    // ignore directory read errors
  }

  return undefined;
}

export async function loadExecutorConfig(
  cwd: string,
  options: LoadExecutorConfigOptions = {}
): Promise<LoadedExecutorConfig> {
  const configPath = await resolveConfigPath(cwd, options.configPath);
  const module = await loadModule(configPath, createModuleLoadOptions(cwd, options));
  const config = extractConfig(module);

  if (!config) {
    throw new Error(
      `Failed to load Autometa config from "${configPath}". ` +
        "Ensure the module exports a Config instance (e.g. export default defineConfig({...}))."
    );
  }

  const resolveOptions = {
    ...(options.environment && options.environment.trim().length > 0
      ? { environment: options.environment }
      : {}),
    ...(options.modules && options.modules.length > 0 ? { modules: options.modules } : {}),
    ...(options.groups && options.groups.length > 0 ? { groups: options.groups } : {}),
  };

  const resolved = config.resolve(
    Object.keys(resolveOptions).length > 0 ? resolveOptions : undefined
  );

  return {
    filePath: configPath,
    config,
    resolved,
  };
}

async function resolveConfigPath(cwd: string, explicitPath?: string): Promise<string> {
  if (explicitPath) {
    const absolutePath = resolvePath(cwd, explicitPath);
    await ensureFileExists(absolutePath);
    return absolutePath;
  }

  // Walk upwards from cwd to root, searching for a valid config file
  // in each directory according to our patterns.
  let current = cwd;
  // Guard against infinite loops by limiting depth to a reasonable number
  for (let depth = 0; depth < 50; depth += 1) {
    const found = await findConfigInDir(current);
    if (found) {
      return found;
    }

    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  const expected = [
    ...CONFIG_EXTENSIONS.map((ext) => `autometa.config.${ext}`),
    "autometa.<name>.config.{ts,mts,cts,js,mjs,cjs}",
  ];
  throw new Error(
    `Unable to locate an Autometa config file starting from "${cwd}". Expected one of: ${expected.join(
      ", "
    )}`
  );
}

async function ensureFileExists(path: string): Promise<void> {
  try {
    await access(path, fsConstants.F_OK);
  } catch {
    throw new Error(`Config file not found at "${path}"`);
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function createModuleLoadOptions(
  cwd: string,
  options: LoadExecutorConfigOptions
): ModuleLoadOptions {
  return {
    cwd,
    ...(options.cacheDir ? { cacheDir: options.cacheDir } : {}),
    ...(options.external ? { external: options.external } : {}),
  };
}

function extractConfig(exports: Record<string, unknown>): Config | undefined {
  const candidates: unknown[] = [];

  if (exports.default !== undefined) {
    candidates.push(exports.default);
  }

  for (const value of Object.values(exports)) {
    candidates.push(value);
  }

  for (const candidate of candidates) {
    const config = asConfig(candidate);
    if (config) {
      return config;
    }
  }

  return undefined;
}

function asConfig(value: unknown): Config | undefined {
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    return undefined;
  }

  if (value instanceof Config) {
    return value;
  }

  const maybeConfig = value as { resolve?: unknown; current?: unknown };
  if (typeof maybeConfig.resolve === "function" && typeof maybeConfig.current === "function") {
    return maybeConfig as Config;
  }

  const maybeDefault = (value as { readonly default?: unknown }).default;
  if (maybeDefault && maybeDefault !== value) {
    return asConfig(maybeDefault);
  }

  return undefined;
}
