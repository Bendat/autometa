import { builtinModules } from "node:module";
import { isAbsolute, join, resolve } from "node:path";
import { mkdir, rm, writeFile } from "node:fs/promises";

import { build } from "esbuild";
import type { BuildOptions } from "esbuild";
import type {
  BuildHook,
  BuildHookContext,
  BuilderConfig,
  ModuleFormat,
  SourceMapSetting,
} from "@autometa/config";

export interface CompileModulesOptions {
  readonly cwd: string;
  readonly cacheDir: string;
  readonly builder?: BuilderConfig;
}

export interface CompileModulesResult {
  readonly bundlePath: string;
  readonly outDir?: string;
  readonly format: ModuleFormat;
}

const DEFAULT_FORMAT: ModuleFormat = "cjs";
const DEFAULT_TARGET = "node20";
const DEFAULT_SOURCEMAP: SourceMapSetting = "inline";
const DEFAULT_EXTERNALS = [
  "p-limit",
  "@autometa/*",
  "@cucumber/*",
];

const BUILTIN_EXTERNALS = new Set<string>([
  ...builtinModules,
  ...builtinModules.map((moduleId) => `node:${moduleId}`),
]);

export async function compileModules(
  orderedEntries: readonly string[],
  options: CompileModulesOptions
): Promise<CompileModulesResult> {
  const format = options.builder?.format ?? DEFAULT_FORMAT;
  const target = options.builder?.target ?? DEFAULT_TARGET;
  const esbuildTarget: string | string[] = Array.isArray(target)
    ? [...target] as string[]
    : target;
  const sourcemap = options.builder?.sourcemap ?? DEFAULT_SOURCEMAP;
  const tsconfig = options.builder?.tsconfig
    ? resolve(options.cwd, options.builder.tsconfig)
    : undefined;
  const userExternal = options.builder?.external ?? [];
  const external = Array.from(
    new Set<string>([...BUILTIN_EXTERNALS, ...DEFAULT_EXTERNALS, ...userExternal])
  );
  const baseOutDir = resolveOutputBase(options);
  const outDir = join(baseOutDir, format);
  const entryFile = await createAggregateEntryFile(orderedEntries, options);

  await ensureOutputDirectory(outDir, format);

  const resolvedEntries = orderedEntries.map((entry) =>
    isAbsolute(entry) ? entry : resolve(options.cwd, entry)
  );

  const hookContext: BuildHookContext = {
    cwd: options.cwd,
    cacheDir: options.cacheDir,
    outDir,
    entries: resolvedEntries,
    format,
    ...(target !== undefined ? { target } : {}),
    ...(sourcemap !== undefined ? { sourcemap } : {}),
    ...(tsconfig ? { tsconfig } : {}),
    ...(external.length > 0 ? { external } : {}),
  };

  await runHooks(options.builder?.hooks?.before, hookContext);

  if (resolvedEntries.length > 0) {
    const entryName = "__autometa_entry__";
    const bundleFileName = format === "esm" ? "__modules__.mjs" : "__modules__.cjs";
    const outfile = join(outDir, bundleFileName);
    const buildOptions: BuildOptions = {
      absWorkingDir: options.cwd,
      entryPoints: {
        [entryName]: entryFile,
      },
      outfile,
      bundle: true,
      format,
      platform: "node",
      target: esbuildTarget,
      sourcemap,
      splitting: false,
      write: true,
      external,
      logLevel: "silent",
      treeShaking: false,
      ...(tsconfig ? { tsconfig } : {}),
    };
    await build(buildOptions);

    await runHooks(options.builder?.hooks?.after, hookContext);

    return {
      bundlePath: outfile,
      outDir,
      format,
    };
  }

  await runHooks(options.builder?.hooks?.after, hookContext);

  return {
    bundlePath: entryFile,
    format,
  };
}

function resolveOutputBase(options: CompileModulesOptions): string {
  if (!options.builder?.outDir) {
    return join(options.cacheDir, "modules");
  }

  const configured = options.builder.outDir;
  return isAbsolute(configured) ? configured : resolve(options.cwd, configured);
}

async function ensureOutputDirectory(outDir: string, format: ModuleFormat): Promise<void> {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const packageJsonPath = join(outDir, "package.json");
  const typeField = format === "esm" ? "module" : "commonjs";
  await writeFile(packageJsonPath, JSON.stringify({ type: typeField }, null, 2), "utf8");
}

async function createAggregateEntryFile(entries: readonly string[], options: CompileModulesOptions): Promise<string> {
  if (entries.length === 0) {
    const stubPath = join(options.cacheDir, "modules", "__noop__.ts");
    await mkdir(join(options.cacheDir, "modules"), { recursive: true });
    await writeFile(stubPath, "export {};", "utf8");
    return stubPath;
  }

  const modulesDir = join(options.cacheDir, "modules");
  await mkdir(modulesDir, { recursive: true });

  const aggregatePath = join(modulesDir, "__entry__.ts");
  const uniqueEntries = Array.from(new Set(entries.map((entry) =>
    isAbsolute(entry) ? entry : resolve(options.cwd, entry)
  )));

  const moduleIdentifiers = uniqueEntries.map((_, index) => `module_${index}`);
  const imports = uniqueEntries
    .map((entry, index) => `import * as ${moduleIdentifiers[index]} from ${JSON.stringify(entry)};`)
    .join("\n");

  //  Search for a module that exports stepsEnvironment
  // Create a helper function that prevents esbuild from constant-folding property accesses
  const stepsChecks = moduleIdentifiers.map((id) => {
    return `  const val_${id} = ${id}['stepsEnvironment'];
  if (val_${id}) return val_${id};`;
  }).join('\n');

  const contents = `${imports}

function __findStepsEnvironment() {
${stepsChecks}
  return undefined;
}

export const stepsEnvironment = __findStepsEnvironment();
export const modules = [${moduleIdentifiers.join(', ')}];
export default modules;\n`;

  await writeFile(aggregatePath, contents, "utf8");

  return aggregatePath;
}

async function runHooks(
  hooks: readonly BuildHook[] | undefined,
  context: BuildHookContext
): Promise<void> {
  if (!hooks || hooks.length === 0) {
    return;
  }

  for (const hook of hooks) {
    await hook(context);
  }
}
