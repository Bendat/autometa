import { promises as fs } from "node:fs";
import { extname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import { Command } from "commander";
import type { ExecutorConfig, LoggingConfig } from "@autometa/config";
import { HTTP, createLoggingPlugin, type HTTPLogEvent } from "@autometa/http";
import { CucumberRunner } from "@autometa/runner";
import type { GlobalWorld, RunnerStepsSurface } from "@autometa/runner";
import { parseGherkin, type SimpleFeature, type SimpleRule } from "@autometa/gherkin";
import type { ScopePlan, ScopeNode } from "@autometa/scopes";

import { compileModules } from "../compiler/module-compiler";
import {
  createCliRuntime,
  type RuntimeOptions,
} from "../runtime/cli-runtime";
import { expandFilePatterns } from "../utils/glob";
import { loadExecutorConfig } from "../loaders/config";
import { formatSummary } from "../utils/formatter";
import type { SummaryFormatter } from "../runtime/types";
import type { RuntimeReporter } from "../utils/reporter";
import type { RuntimeSummary } from "../runtime/types";
import { orchestrate, isNativeRunnerAvailable, type RunnerType } from "../orchestrator";

export interface RunCommandOptions {
  readonly cwd?: string;
  readonly patterns?: readonly string[];
  readonly dryRun?: boolean;
  readonly watch?: boolean;
  readonly verbose?: boolean;
  readonly reporters?: readonly RuntimeReporter[];
  readonly summaryFormatter?: SummaryFormatter;
  readonly modules?: readonly string[];
  readonly groups?: readonly string[];
  /**
   * Force a specific runner mode.
   * - "native": Use vitest/jest if configured (default behavior)
   * - "standalone": Always use the built-in CLI runtime
   * - "auto": Detect from config (same as "native")
   */
  readonly mode?: "native" | "standalone" | "auto";
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
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
    .option("--watch", "Run in watch mode (vitest/jest only)")
    .option("--verbose", "Show detailed output including runner detection")
    .option("--standalone", "Force standalone runtime instead of native runner")
    .option("-g, --group <group...>", "Filter module groups to include")
    .option("-m, --module <module...>", "Filter modules to include (by id or unambiguous suffix)")
    .action(async (patterns: string[], flags: { dryRun?: boolean; watch?: boolean; verbose?: boolean; standalone?: boolean; module?: string[]; group?: string[] }) => {
      try {
        const summary = await runFeatures({
          cwd: process.cwd(),
          ...(patterns.length > 0 ? { patterns } : {}),
          ...(typeof flags?.dryRun === "boolean" ? { dryRun: flags.dryRun } : {}),
          ...(typeof flags?.watch === "boolean" ? { watch: flags.watch } : {}),
          ...(typeof flags?.verbose === "boolean" ? { verbose: flags.verbose } : {}),
          ...(flags?.standalone ? { mode: "standalone" as const } : {}),
          ...(Array.isArray(flags?.group) ? { groups: flags.group } : {}),
          ...(Array.isArray(flags?.module) ? { modules: flags.module } : {}),
        });

        if (!summary.success) {
          process.exitCode = 1;
        }
      } catch (error) {
        const output =
          error instanceof Error ? error.stack ?? error.message : String(error);
        // eslint-disable-next-line no-console -- CLI error reporting
        console.error(output);
        process.exitCode = 1;
      }
    });
}

function isScenario(element: SimpleFeature["elements"][number]): boolean {
  return "steps" in element && !("exampleGroups" in element) && !("elements" in element);
}

function isScenarioOutline(element: SimpleFeature["elements"][number]): boolean {
  return "steps" in element && "exampleGroups" in element;
}

function isRule(element: SimpleFeature["elements"][number]): element is SimpleRule {
  return "elements" in element && Array.isArray(element.elements);
}

function createFeatureScopePlan<World>(
  feature: SimpleFeature,
  basePlan: ScopePlan<World>
): ScopePlan<World> {
  // Get all steps from base plan as an array for convenience
  const allSteps = Array.from(basePlan.stepsById.values());

  // Create scenario and rule scope nodes
  const featureChildren: ScopeNode<World>[] = [];
  const scopesById = new Map<string, ScopeNode<World>>(basePlan.scopesById);

  for (const element of feature.elements ?? []) {
    if (isScenario(element) || isScenarioOutline(element)) {
      // Direct scenario under feature
      const scenarioScope: ScopeNode<World> = {
        id: element.id ?? element.name,
        kind: isScenarioOutline(element) ? "scenarioOutline" : "scenario",
        name: element.name,
        mode: "default",
        tags: element.tags ?? [],
        steps: allSteps,
        hooks: [],
        children: [],
        pending: false,
      };
      featureChildren.push(scenarioScope);
      scopesById.set(scenarioScope.id, scenarioScope);
    } else if (isRule(element)) {
      // Rule with child scenarios
      const ruleChildren: ScopeNode<World>[] = [];
      
      for (const ruleElement of element.elements ?? []) {
        if (isScenario(ruleElement) || isScenarioOutline(ruleElement)) {
          const scenarioScope: ScopeNode<World> = {
            id: ruleElement.id ?? ruleElement.name,
            kind: isScenarioOutline(ruleElement) ? "scenarioOutline" : "scenario",
            name: ruleElement.name,
            mode: "default",
            tags: ruleElement.tags ?? [],
            steps: allSteps,
            hooks: [],
            children: [],
            pending: false,
          };
          ruleChildren.push(scenarioScope);
          scopesById.set(scenarioScope.id, scenarioScope);
        }
      }
      
      const ruleScope: ScopeNode<World> = {
        id: element.id ?? element.name,
        kind: "rule",
        name: element.name,
        mode: "default",
        tags: element.tags ?? [],
        steps: allSteps,
        hooks: [],
        children: ruleChildren,
        pending: false,
      };
      featureChildren.push(ruleScope);
      scopesById.set(ruleScope.id, ruleScope);
    }
  }

  // Create a feature scope node with scenario and rule children
  const featureScope: ScopeNode<World> = {
    id: feature.uri ?? feature.name,
    kind: "feature",
    name: feature.name,
    mode: "default",
    tags: feature.tags ?? [],
    steps: allSteps,
    hooks: [],
    children: featureChildren,
    pending: false,
  };

  // Add feature scope as a child of the existing root scope
  const existingRoot = basePlan.root;
  const updatedRoot: ScopeNode<World> = {
    ...existingRoot,
    children: [...existingRoot.children, featureScope],
  };

  // Add feature to the scopes map
  scopesById.set(featureScope.id, featureScope);
  scopesById.set(updatedRoot.id, updatedRoot);

  // Return a new scope plan with the updated hierarchy
  const scopePlan: ScopePlan<World> = {
    root: updatedRoot,
    stepsById: basePlan.stepsById,
    hooksById: basePlan.hooksById,
    scopesById,
  };

  if (basePlan.worldFactory) {
    (scopePlan as { worldFactory?: typeof basePlan.worldFactory }).worldFactory = basePlan.worldFactory;
  }

  if (basePlan.parameterRegistry) {
    (scopePlan as { parameterRegistry?: typeof basePlan.parameterRegistry }).parameterRegistry = basePlan.parameterRegistry;
  }

  return scopePlan;
}

export async function runFeatures(options: RunCommandOptions = {}): Promise<RunCommandResult> {
  const cwd = options.cwd ?? process.cwd();
  const cacheDir = join(cwd, ".autometa-cli", "cache");
  const summaryFormatter = options.summaryFormatter ?? formatSummary;
  const { resolved } = await loadExecutorConfig(cwd, {
    cacheDir,
    ...(options.modules ? { modules: [...options.modules] } : {}),
    ...(options.groups ? { groups: [...options.groups] } : {}),
  });
  const executorConfig = resolved.config;

  // =========================================================================
  // SMART ORCHESTRATOR: Try native runner first (vitest/jest)
  // =========================================================================
  const mode = options.mode ?? "native";
  
  if (mode !== "standalone") {
    const orchestratorResult = await orchestrate({
      cwd,
      config: executorConfig,
      ...(options.patterns ? { patterns: options.patterns } : {}),
      ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
      ...(options.watch !== undefined ? { watch: options.watch } : {}),
      ...(options.verbose !== undefined ? { verbose: options.verbose } : {}),
    });

    // If a native runner was used (vitest/jest), return its result
    if (orchestratorResult.runner !== "default") {
      return {
        success: orchestratorResult.success,
        total: 0, // Native runner handles its own reporting
        passed: 0,
        failed: 0,
        skipped: 0,
        pending: 0,
        durationMs: 0,
        scenarios: [],
      };
    }

    // Native runner not available or not configured - fall through to standalone
    if (options.verbose) {
      console.log("[autometa] Using standalone runtime");
    }
  }

  // =========================================================================
  // STANDALONE RUNTIME: Built-in CLI execution
  // =========================================================================
  const hierarchicalBufferOutput = executorConfig.reporting?.hierarchical?.bufferOutput;
  const reporterOptions: RuntimeOptions["reporter"] | undefined =
    hierarchicalBufferOutput !== undefined
      ? { hierarchical: { bufferOutput: hierarchicalBufferOutput } }
      : undefined;
  const runtimeOptions: RuntimeOptions = {
    ...(typeof options.dryRun === "boolean" ? { dryRun: options.dryRun } : {}),
    ...(options.reporters ? { reporters: options.reporters } : {}),
    ...(reporterOptions ? { reporter: reporterOptions } : {}),
  };
  const { runtime, hookLogger, execute } = createCliRuntime(runtimeOptions);
  configureHttpLogging(executorConfig.logging);

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
  let stepsEnvironment = builder.steps();

  const modulePlan = await createModulePlan(executorConfig, cwd);
  const compileOptions: Parameters<typeof compileModules>[1] = executorConfig.builder
    ? { cwd, cacheDir, builder: executorConfig.builder }
    : { cwd, cacheDir };
  const compileResult = await compileModules(modulePlan.orderedFiles, compileOptions);

  if (modulePlan.orderedFiles.length > 0) {
    const imported = await import(pathToFileURL(compileResult.bundlePath).href);
    const resolved = resolveStepsEnvironment(imported);
    if (resolved) {
      stepsEnvironment = resolved;
    }
  }

  CucumberRunner.setSteps(stepsEnvironment);

  const basePlan = stepsEnvironment.getPlan();

  for (const featurePath of featureFiles) {
    const feature = await readFeatureFile(featurePath, cwd);
    const scopePlan = createFeatureScopePlan(feature, basePlan);
    const coordinated = stepsEnvironment.coordinateFeature({
      feature,
      plan: scopePlan,
      config: executorConfig,
      runtime,
      hookLogger,
    });
    coordinated.register(runtime);
  }

  const summary = await execute();
  logSummary(summary, resolved.environment, summaryFormatter);

  return summary;
}

type ModuleLike = Record<string, unknown>;

function resolveStepsEnvironment(imported: unknown): RunnerStepsSurface<GlobalWorld> | undefined {
  const candidates = collectCandidateModules(imported);
  for (const candidate of candidates) {
    const environment = extractStepsEnvironment(candidate);
    if (environment) {
      return environment;
    }
  }
  return undefined;
}

function collectCandidateModules(imported: unknown): readonly ModuleLike[] {
  if (!imported || typeof imported !== "object") {
    return [];
  }

  const record = imported as ModuleLike;
  const modules = new Set<ModuleLike>();
  modules.add(record);

  const exportedModules = record.modules;
  if (Array.isArray(exportedModules)) {
    for (const entry of exportedModules) {
      if (entry && typeof entry === "object") {
        modules.add(entry as ModuleLike);
      }
    }
  }

  const defaultExport = record.default;
  if (Array.isArray(defaultExport)) {
    for (const entry of defaultExport) {
      if (entry && typeof entry === "object") {
        modules.add(entry as ModuleLike);
      }
    }
  } else if (defaultExport && typeof defaultExport === "object") {
    modules.add(defaultExport as ModuleLike);
  }

  return Array.from(modules);
}

function extractStepsEnvironment(candidate: ModuleLike): RunnerStepsSurface<GlobalWorld> | undefined {
  if (isStepsEnvironment(candidate)) {
    return candidate;
  }

  const steps = candidate.stepsEnvironment;
  if (isStepsEnvironment(steps)) {
    return steps;
  }

  const defaultExport = candidate.default;
  if (isStepsEnvironment(defaultExport)) {
    return defaultExport;
  }

  return undefined;
}

function isStepsEnvironment(value: unknown): value is RunnerStepsSurface<GlobalWorld> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as ModuleLike;
  return typeof candidate.coordinateFeature === "function"
    && typeof candidate.Given === "function"
    && typeof candidate.When === "function"
    && typeof candidate.Then === "function";
}

interface ModulePlan {
  readonly orderedFiles: readonly string[];
}

async function createModulePlan(config: ExecutorConfig, cwd: string): Promise<ModulePlan> {
  const orderedFiles: string[] = [];
  const seenFiles = new Set<string>();
  const processed = new Set<string>(["features", "steps"]);
  const rootsRecord = config.roots as Record<string, readonly string[] | undefined>;

  const pushFiles = (files: readonly string[]): void => {
    for (const file of files) {
      if (seenFiles.has(file)) {
        continue;
      }
      seenFiles.add(file);
      orderedFiles.push(file);
    }
  };

  for (const key of ROOT_LOAD_ORDER) {
    const entries = rootsRecord[key];
    if (!entries || entries.length === 0) {
      processed.add(key);
      continue;
    }
    const files = await resolveRootFiles(entries, cwd);
    if (files.length > 0) {
      pushFiles(files);
    }
    processed.add(key);
  }

  for (const [key, entries] of Object.entries(rootsRecord)) {
    if (processed.has(key)) {
      continue;
    }
    if (!entries || entries.length === 0) {
      continue;
    }
    const files = await resolveRootFiles(entries, cwd);
    if (files.length > 0) {
      pushFiles(files);
    }
  }

  const stepFiles = await resolveRootFiles(config.roots.steps, cwd);
  pushFiles(stepFiles);

  return {
    orderedFiles,
  };
}

async function resolveRootFiles(entries: readonly string[], cwd: string): Promise<string[]> {
  const patterns = buildPatterns(entries, STEP_FALLBACK_GLOB);
  if (patterns.length === 0) {
    return [];
  }
  const matches = await expandFilePatterns(patterns, cwd);
  return filterCodeFiles(matches);
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

function logSummary(
  summary: RuntimeSummary,
  environment: string,
  formatter: SummaryFormatter
): void {
  // eslint-disable-next-line no-console -- CLI summary output
  console.log(formatter(summary, { environment }));
}

function configureHttpLogging(logging: LoggingConfig | undefined): void {
  if (!logging?.http) {
    return;
  }

  const registered = HTTP.getSharedPlugins();
  if (registered.some((plugin) => plugin.name === "http-logging")) {
    return;
  }

  HTTP.registerSharedPlugin(createLoggingPlugin(logHttpEvent));
}

function logHttpEvent(event: HTTPLogEvent): void {
  const timestamp = new Date(event.timestamp).toISOString();
  const url = resolveRequestUrl(event.request);

  switch (event.type) {
    case "request": {
      const method = event.request.method ?? "<unknown>";
      console.log(`[HTTP ${timestamp}] → ${method} ${url}`);
      break;
    }
    case "response": {
      const status = event.response.status;
      console.log(`[HTTP ${timestamp}] ← ${status} ${url}`);
      break;
    }
    case "error": {
      const message =
        event.error instanceof Error ? event.error.message : String(event.error);
      console.error(`[HTTP ${timestamp}] ! ${url} ${message}`);
      break;
    }
  }
}

function resolveRequestUrl(request: HTTPLogEvent["request"]): string {
  const url = request.fullUrl;
  if (url) {
    return url;
  }

  if (request.baseUrl && request.route && request.route.length > 0) {
    const normalizedRoute = request.route.join("/");
    return `${request.baseUrl.replace(/\/?$/u, "")}/${normalizedRoute}`;
  }

  if (request.baseUrl) {
    return request.baseUrl;
  }

  if (request.route && request.route.length > 0) {
    return request.route.join("/");
  }

  return "<unknown>";
}
