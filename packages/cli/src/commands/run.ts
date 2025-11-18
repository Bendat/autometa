import { promises as fs } from "node:fs";
import { extname, join, relative } from "node:path";

import { Command } from "commander";
import type { ExecutorConfig } from "@autometa/config";
import { CucumberRunner } from "@autometa/runner";
import type { GlobalWorld } from "@autometa/runner";
import { parseGherkin, type SimpleFeature } from "@autometa/gherkin";

import { createCliRuntime, type RuntimeSummary } from "../runtime/cli-runtime";
import { expandFilePatterns } from "../utils/glob";
import { loadModule } from "../loaders/module-loader";
import { loadExecutorConfig } from "../loaders/config";

export interface RunCommandOptions {
  readonly cwd?: string;
  readonly patterns?: readonly string[];
  readonly dryRun?: boolean;
}

export interface RunCommandResult extends RuntimeSummary {}

const STEP_FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"]);
const STEP_FALLBACK_GLOB = "**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}";
const FEATURE_FALLBACK_GLOB = "**/*.feature";
const ROOT_LOAD_ORDER = ["parameterTypes", "support", "hooks", "app"];

export function registerRunCommand(program: Command): Command {
  return program
    .command("run")
    .description("Execute Autometa feature files")
    .argument("[patterns...]", "Feature files or glob patterns")
    .option("--dry-run", "Collect scenarios without executing steps")
    .action(async (patterns: string[], flags: { dryRun?: boolean }) => {
      try {
        const summary = await runFeatures({
          cwd: process.cwd(),
          ...(patterns.length > 0 ? { patterns } : {}),
          ...(typeof flags?.dryRun === "boolean" ? { dryRun: flags.dryRun } : {}),
        });

        if (!summary.success) {
          process.exitCode = 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // eslint-disable-next-line no-console -- CLI error reporting
        console.error(message);
        process.exitCode = 1;
      }
    });
}

export async function runFeatures(options: RunCommandOptions = {}): Promise<RunCommandResult> {
  const cwd = options.cwd ?? process.cwd();
  const runtimeOptions =
    typeof options.dryRun === "boolean" ? { dryRun: options.dryRun } : {};
  const cacheDir = join(cwd, ".autometa-cli", "cache");

  const { runtime, execute } = createCliRuntime(runtimeOptions);
  const loadedModules = new Set<string>();

  const { resolved } = await loadExecutorConfig(cwd, { cacheDir });
  const executorConfig = resolved.config;

  const patternSource =
    options.patterns && options.patterns.length > 0
      ? [...options.patterns]
      : [...executorConfig.roots.features];

  const featurePatterns = buildPatterns(patternSource, FEATURE_FALLBACK_GLOB);
  const featureFiles = (await expandFilePatterns(featurePatterns, cwd)).filter((file) =>
    file.toLowerCase().endsWith(".feature")
  );

  if (featureFiles.length === 0) {
    throw new Error(
      `No feature files found for patterns: ${patternSource.map((pattern) => `"${pattern}"`).join(", ")}`
    );
  }

  const builder = CucumberRunner.builder<GlobalWorld>();
  const stepsEnvironment = builder.steps();

  await loadSupplementaryRoots(executorConfig, {
    cwd,
    cacheDir,
    loaded: loadedModules,
  });

  await loadStepFiles(executorConfig.roots.steps, {
    cwd,
    cacheDir,
    loaded: loadedModules,
  });

  for (const featurePath of featureFiles) {
    const feature = await readFeatureFile(featurePath, cwd);
    const coordinated = stepsEnvironment.coordinateFeature({
      feature,
      config: executorConfig,
      runtime,
    });
    coordinated.register(runtime);
  }

  const summary = await execute();
  logSummary(summary, resolved.environment);

  return summary;
}

interface ModuleLoadContext {
  readonly cwd: string;
  readonly cacheDir: string;
  readonly loaded: Set<string>;
}

function buildPatterns(entries: readonly string[], fallbackGlob: string): string[] {
  const patterns = new Set<string>();
  for (const entry of entries) {
    const normalized = entry.trim();
    if (!normalized) {
      continue;
    }
    for (const pattern of toPatterns(normalized, fallbackGlob)) {
      patterns.add(pattern);
    }
  }
  return Array.from(patterns);
}

function toPatterns(entry: string, fallbackGlob: string): string[] {
  if (hasGlobMagic(entry) || hasFileExtension(entry)) {
    return [entry];
  }

  return [appendGlob(entry, fallbackGlob)];
}

function hasGlobMagic(input: string): boolean {
  return /[*?{}()[\]!,@+]/.test(input);
}

function hasFileExtension(input: string): boolean {
  const normalized = input.replace(/\\/g, "/");
  const trimmed = normalized === "/" ? "/" : normalized.replace(/\/+$/u, "");
  if (!trimmed || trimmed === "." || trimmed === "..") {
    return false;
  }
  return Boolean(extname(trimmed));
}

function appendGlob(entry: string, glob: string): string {
  const normalized = entry.replace(/\\/g, "/");
  const trimmed = normalized === "/" ? "/" : normalized.replace(/\/+$/u, "");
  if (!trimmed || trimmed === ".") {
    return glob;
  }
  if (trimmed === "/") {
    return `/${glob}`;
  }
  return `${trimmed}/${glob}`;
}

async function loadSupplementaryRoots(
  config: ExecutorConfig,
  context: ModuleLoadContext
): Promise<void> {
  const processed = new Set<string>(["features", "steps"]);

  const rootsRecord = config.roots as Record<string, readonly string[] | undefined>;

  for (const key of ROOT_LOAD_ORDER) {
    const entries = rootsRecord[key];
    if (entries && entries.length > 0) {
      await loadModules(entries, context, STEP_FALLBACK_GLOB);
      processed.add(key);
    }
  }

  for (const [key, value] of Object.entries(rootsRecord)) {
    if (processed.has(key)) {
      continue;
    }
    if (value && value.length > 0) {
      await loadModules(value, context, STEP_FALLBACK_GLOB);
    }
  }
}

async function loadStepFiles(entries: readonly string[], context: ModuleLoadContext): Promise<void> {
  if (entries.length === 0) {
    return;
  }
  await loadModules(entries, context, STEP_FALLBACK_GLOB);
}

async function loadModules(
  entries: readonly string[],
  context: ModuleLoadContext,
  fallbackGlob: string
): Promise<void> {
  const patterns = buildPatterns(entries, fallbackGlob);
  if (patterns.length === 0) {
    return;
  }

  const matches = await expandFilePatterns(patterns, context.cwd);
  const files = filterCodeFiles(matches);

  for (const file of files) {
    if (context.loaded.has(file)) {
      continue;
    }
    await loadModule(file, {
      cwd: context.cwd,
      cacheDir: context.cacheDir,
    });
    context.loaded.add(file);
  }
}

function filterCodeFiles(files: readonly string[]): string[] {
  return files.filter((file) => {
    const lower = file.toLowerCase();
    if (lower.endsWith(".d.ts")) {
      return false;
    }
    const dotIndex = lower.lastIndexOf(".");
    if (dotIndex === -1) {
      return false;
    }
    const extension = lower.slice(dotIndex);
    return STEP_FILE_EXTENSIONS.has(extension);
  });
}

async function readFeatureFile(path: string, cwd: string): Promise<SimpleFeature> {
  const source = await fs.readFile(path, "utf8");
  const feature = parseGherkin(source);
  if (!feature.uri) {
    const relativePath = relative(cwd, path);
    feature.uri = relativePath.startsWith("..") ? path : relativePath;
  }
  return feature;
}

function logSummary(summary: RuntimeSummary, environment: string): void {
  const duration = summary.durationMs < 1000
    ? `${summary.durationMs.toFixed(0)} ms`
    : `${(summary.durationMs / 1000).toFixed(2)} s`;

  // eslint-disable-next-line no-console -- CLI summary output
  console.log(
    `Environment: ${environment} | Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed} | Skipped: ${summary.skipped} | Pending: ${summary.pending} | Duration: ${duration}`
  );
}
