import { createHash } from "crypto";
import { promises as fs } from "fs";
import { builtinModules } from "module";
import { dirname, extname, isAbsolute, join, resolve } from "path";
import { pathToFileURL } from "url";
import { build, type OutputFile } from "esbuild";

const TS_EXTENSIONS = new Set([".ts", ".tsx", ".cts", ".mts"]);
const BUILTIN_EXTERNALS = new Set<string>([
  ...builtinModules,
  ...builtinModules.map((moduleId: string) => `node:${moduleId}`),
]);
const DEFAULT_EXTERNALS = new Set<string>(["p-limit"]);

export interface ModuleLoadOptions {
  readonly cwd: string;
  readonly external?: readonly string[];
  readonly cacheDir?: string;
}

export async function loadModule(
  specifier: string,
  options: ModuleLoadOptions
): Promise<Record<string, unknown>> {
  if (isBareSpecifier(specifier)) {
    return import(specifier);
  }

  const resolvedPath = resolve(options.cwd, specifier);
  const filePath = await resolveFilePath(resolvedPath);
  const extension = extname(filePath).toLowerCase();

  if (TS_EXTENSIONS.has(extension)) {
    return loadTranspiledModule(filePath, options);
  }

  return import(pathToFileURL(filePath).href);
}

function isBareSpecifier(specifier: string): boolean {
  if (!specifier) {
    return false;
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return false;
  }
  return !isAbsolute(specifier);
}

async function resolveFilePath(pathCandidate: string): Promise<string> {
  if (await pathExists(pathCandidate)) {
    return pathCandidate;
  }

  const directory = dirname(pathCandidate);
  const fileName = pathCandidate.slice(directory.length + 1);

  for (const extension of TS_EXTENSIONS) {
    const candidate = join(directory, `${fileName}${extension}`);
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Unable to resolve module at ${pathCandidate}`);
}

async function loadTranspiledModule(
  filePath: string,
  options: ModuleLoadOptions
): Promise<Record<string, unknown>> {
  const cacheDirectory = options.cacheDir ?? join(options.cwd, ".autometa-cli", "cache");
  await fs.mkdir(cacheDirectory, { recursive: true });

  const stats = await fs.stat(filePath);
  const cacheKey = createCacheKey(filePath, stats.mtimeMs);
  const outputFile = join(cacheDirectory, `${cacheKey}.cjs`);

  if (!(await pathExists(outputFile))) {
    const external = new Set<string>([
      ...BUILTIN_EXTERNALS,
      ...DEFAULT_EXTERNALS,
      ...(options.external ?? []),
    ]);

    const result = await build({
      entryPoints: [filePath],
      absWorkingDir: options.cwd,
      bundle: true,
      platform: "node",
      format: "cjs",
      target: "node20",
      sourcemap: "inline",
      write: false,
      external: Array.from(external),
    });

    const output = result.outputFiles?.find((file: OutputFile) => !file.path.endsWith(".map"));
    if (!output) {
      throw new Error(`Failed to compile module at ${filePath}`);
    }

    await fs.writeFile(outputFile, output.text, "utf8");
  }

  const moduleUrl = `${pathToFileURL(outputFile).href}?v=${cacheKey}`;
  return import(moduleUrl);
}

function createCacheKey(filePath: string, mtimeMs: number): string {
  return createHash("sha1")
    .update(filePath)
    .update(String(mtimeMs))
    .digest("hex");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
