import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { resolve as resolvePath } from "node:path";

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

const CONFIG_CANDIDATES = [
  "autometa.config.ts",
  "autometa.config.mts",
  "autometa.config.cts",
  "autometa.config.js",
  "autometa.config.mjs",
  "autometa.config.cjs",
];

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

  for (const candidate of CONFIG_CANDIDATES) {
    const absoluteCandidate = resolvePath(cwd, candidate);
    if (await fileExists(absoluteCandidate)) {
      return absoluteCandidate;
    }
  }

  throw new Error(
    `Unable to locate an Autometa config file in "${cwd}". Expected one of: ${CONFIG_CANDIDATES.join(
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
