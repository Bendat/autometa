import { promises as fs } from "node:fs";
import { extname, join, relative, resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";

import { Command } from "commander";
import type { ExecutorConfig, LoggingConfig } from "@autometa/config";
import { HTTP, createLoggingPlugin, type HTTPLogEvent } from "@autometa/http";
import { CucumberRunner, STEPS_ENVIRONMENT_META } from "@autometa/runner";
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
import { splitPatternsAndRunnerArgs } from "../utils/handover";
import type { SummaryFormatter } from "../runtime/types";
import type { RuntimeReporter } from "../utils/reporter";
import type { RuntimeSummary } from "../runtime/types";
import { orchestrate, isNativeRunnerAvailable, type RunnerType } from "../orchestrator";
import { resolveCliCacheDir } from "../utils/cache-dir";

export interface RunCommandOptions {
  readonly cwd?: string;
  /**
   * Directory used by the CLI to write transpiled/cached runtime artifacts.
   * When omitted, the CLI will choose a sensible default (preferring node_modules/.cache).
   */
  readonly cacheDir?: string;
  readonly patterns?: readonly string[];
  /**
   * Extra args to pass directly to the detected native runner.
   * Only used when mode is not "standalone".
   */
  readonly runnerArgs?: readonly string[];
  readonly dryRun?: boolean;
  readonly watch?: boolean;
  readonly verbose?: boolean;
  readonly reporters?: readonly RuntimeReporter[];
  readonly summaryFormatter?: SummaryFormatter;
  readonly modules?: readonly string[];
  readonly groups?: readonly string[];
  readonly environment?: string;
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

function normalizeGlobLikePath(input: string): string {
  return input.replace(/\\/g, "/").replace(/^\.\//u, "");
}

function patternIsUnderRoot(pattern: string, root: string): boolean {
  const p = normalizeGlobLikePath(pattern);
  const r = normalizeGlobLikePath(root).replace(/\/+$/u, "");
  if (!r) {
    return false;
  }
  return p === r || p.startsWith(`${r}/`);
}

type ModuleDeclaration =
  | string
  | { readonly name: string; readonly submodules?: readonly ModuleDeclaration[] | undefined };

interface GroupIndexEntry {
  readonly group: string;
  readonly rootAbs: string;
  readonly modulePaths: readonly (readonly string[])[];
}

type FileScope =
  | { readonly kind: "root" }
  | { readonly kind: "group"; readonly group: string }
  | { readonly kind: "module"; readonly group: string; readonly modulePath: readonly string[] };

function flattenModuleDeclarations(
  declarations: readonly ModuleDeclaration[] | undefined,
  prefix: readonly string[] = []
): readonly (readonly string[])[] {
  if (!declarations || declarations.length === 0) {
    return [];
  }

  const results: string[][] = [];

  for (const entry of declarations) {
    if (typeof entry === "string") {
      const next = [...prefix, entry];
      results.push(next);
      continue;
    }

    const next = [...prefix, entry.name];
    results.push(next);

    const nested = flattenModuleDeclarations(entry.submodules ?? undefined, next);
    for (const path of nested) {
      results.push([...path]);
    }
  }

  // Dedupe + sort by deepest first for fast "deepest prefix" matching
  const unique = new Map<string, readonly string[]>();
  for (const path of results) {
    unique.set(path.join("/"), path);
  }

  return Array.from(unique.values()).sort((a, b) => b.length - a.length);
}

function buildGroupIndex(config: ExecutorConfig, cwd: string): readonly GroupIndexEntry[] {
  const groups = config.modules?.groups;
  if (!groups) {
    return [];
  }

  return Object.entries(groups).map(([group, groupConfig]) => {
    const rootAbs = resolvePath(cwd, groupConfig.root);
    const modulePaths = flattenModuleDeclarations(groupConfig.modules as unknown as ModuleDeclaration[]);
    return { group, rootAbs, modulePaths } satisfies GroupIndexEntry;
  });
}

function normalizePathSegments(input: string): string[] {
  const normalized = input.replace(/\\/g, "/");
  return normalized.split("/").filter(Boolean);
}

function isPathUnderRoot(fileAbs: string, rootAbs: string): boolean {
  const rel = relative(rootAbs, fileAbs);
  if (rel === "") {
    return true;
  }
  return !rel.startsWith("..") && !rel.startsWith("../") && !rel.startsWith("..\\");
}

function startsWithSegments(haystack: readonly string[], needle: readonly string[]): boolean {
  if (needle.length > haystack.length) {
    return false;
  }
  for (let i = 0; i < needle.length; i += 1) {
    if (haystack[i] !== needle[i]) {
      return false;
    }
  }
  return true;
}

function resolveFileScope(fileAbs: string, groupIndex: readonly GroupIndexEntry[]): FileScope {
  if (fileAbs.startsWith("node:")) {
    return { kind: "root" };
  }

  for (const entry of groupIndex) {
    if (!isPathUnderRoot(fileAbs, entry.rootAbs)) {
      continue;
    }

    const rel = relative(entry.rootAbs, fileAbs);
    const segments = normalizePathSegments(rel);

    for (const modulePath of entry.modulePaths) {
      if (startsWithSegments(segments, modulePath)) {
        return {
          kind: "module",
          group: entry.group,
          modulePath,
        };
      }
    }

    return {
      kind: "group",
      group: entry.group,
    };
  }

  return { kind: "root" };
}

function parseScopeOverrideTag(tags: readonly string[] | undefined):
  | { readonly group: string; readonly modulePath?: readonly string[] }
  | undefined {
  if (!tags || tags.length === 0) {
    return undefined;
  }

  for (const tag of tags) {
    const match = tag.match(/^@scope(?::|=|\()(.+?)(?:\))?$/u);
    if (!match) {
      continue;
    }

    const raw = (match[1] ?? "").trim();
    if (!raw) {
      continue;
    }

    const normalized = raw.replace(/\//g, ":");
    const parts = normalized.split(":").filter(Boolean);
    const [group, ...rest] = parts;
    if (!group) {
      continue;
    }

    return rest.length > 0
      ? { group, modulePath: rest }
      : { group };
  }

  return undefined;
}

function resolveFeatureScope(
  featureAbsPath: string,
  feature: SimpleFeature,
  groupIndex: readonly GroupIndexEntry[]
): FileScope {
  const override = parseScopeOverrideTag(feature.tags);
  if (override) {
    if (override.modulePath && override.modulePath.length > 0) {
      return { kind: "module", group: override.group, modulePath: override.modulePath };
    }
    return { kind: "group", group: override.group };
  }

  return resolveFileScope(featureAbsPath, groupIndex);
}

function isVisibleStepScope(stepScope: FileScope, featureScope: FileScope): boolean {
  if (featureScope.kind === "root") {
    return stepScope.kind === "root";
  }

  if (featureScope.kind === "group") {
    if (stepScope.kind === "root") {
      return true;
    }
    return stepScope.kind === "group" && stepScope.group === featureScope.group;
  }

  // featureScope.kind === "module"
  if (stepScope.kind === "root") {
    return true;
  }
  if (stepScope.kind === "group") {
    return stepScope.group === featureScope.group;
  }
  if (stepScope.kind === "module") {
    return stepScope.group === featureScope.group
      && startsWithSegments(featureScope.modulePath, stepScope.modulePath);
  }

  return false;
}

function stepScopeRank(scope: FileScope): number {
  switch (scope.kind) {
    case "module":
      return 200 + scope.modulePath.length;
    case "group":
      return 100;
    default:
      return 0;
  }
}

function collectRepeatedString(value: string, previous: string[]): string[] {
  return [...previous, value];
}

export function registerRunCommand(program: Command): Command {
  return program
    .command("run")
    .description("Execute Autometa feature files")
    .argument("[patterns...]", "Feature files or glob patterns")
    .option(
      "--handover",
      "Pass through runner args after '--' directly to the detected native runner (vitest/jest/playwright)"
    )
    .option(
      "--cache-dir <dir>",
      "Directory for Autometa CLI cache (defaults to node_modules/.cache/autometa when available)"
    )
    .option("--dry-run", "Collect scenarios without executing steps")
    .option("--watch", "Run in watch mode (vitest/jest only)")
    .option("--verbose", "Show detailed output including runner detection")
    .option("--standalone", "Force standalone runtime instead of native runner")
    .option("-e, --environment <environment>", "Select config environment")
    .option(
      "-g, --group <group>",
      "Filter module groups to include (affects module/step loading; patterns are not auto-scoped)",
      collectRepeatedString,
      [] as string[]
    )
    .option(
      "-m, --module <module>",
      "Filter modules to include (by id or unambiguous suffix; affects module/step loading; patterns are not auto-scoped)",
      collectRepeatedString,
      [] as string[]
    )
    .action(async (
      patterns: string[],
      flags: {
        handover?: boolean;
        cacheDir?: string;
        dryRun?: boolean;
        watch?: boolean;
        verbose?: boolean;
        standalone?: boolean;
        module?: string[];
        group?: string[];
        environment?: string;
      }
    ) => {
      try {
        const split = flags?.handover === true
          ? splitPatternsAndRunnerArgs({ patterns, rawArgv: process.argv, handover: true })
          : splitPatternsAndRunnerArgs({ patterns, rawArgv: process.argv });

        const summary = await runFeatures({
          cwd: process.cwd(),
          ...(typeof flags?.cacheDir === "string" && flags.cacheDir.trim().length > 0
            ? { cacheDir: flags.cacheDir }
            : {}),
          ...(split.patterns.length > 0 ? { patterns: split.patterns } : {}),
          ...(split.runnerArgs.length > 0 ? { runnerArgs: split.runnerArgs } : {}),
          ...(typeof flags?.dryRun === "boolean" ? { dryRun: flags.dryRun } : {}),
          ...(typeof flags?.watch === "boolean" ? { watch: flags.watch } : {}),
          ...(typeof flags?.verbose === "boolean" ? { verbose: flags.verbose } : {}),
          ...(flags?.standalone ? { mode: "standalone" as const } : {}),
          ...(typeof flags?.environment === "string" && flags.environment.trim().length > 0
            ? { environment: flags.environment }
            : {}),
          ...(Array.isArray(flags?.group) && flags.group.length > 0 ? { groups: flags.group } : {}),
          ...(Array.isArray(flags?.module) && flags.module.length > 0 ? { modules: flags.module } : {}),
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
  basePlan: ScopePlan<World>,
  options: {
    readonly featureAbsPath: string;
    readonly cwd: string;
    readonly config: ExecutorConfig;
    readonly groupIndex: readonly GroupIndexEntry[];
  }
): ScopePlan<World> {
  const scopingMode = options.config.modules?.stepScoping ?? "global";
  const useScopedSteps = scopingMode === "scoped" && options.groupIndex.length > 0;

  // Get all steps from base plan as an array for convenience
  const allSteps = Array.from(basePlan.stepsById.values());
  const featureFileScope = useScopedSteps
    ? resolveFeatureScope(options.featureAbsPath, feature, options.groupIndex)
    : ({ kind: "root" } as const);

  const visibleSteps = useScopedSteps
    ? allSteps
        .filter((definition) => {
          const file = definition.source?.file;
          const stepScope = file
            ? resolveFileScope(resolvePath(options.cwd, file), options.groupIndex)
            : ({ kind: "root" } as const);
          return isVisibleStepScope(stepScope, featureFileScope);
        })
        .sort((a, b) => {
          const aFile = a.source?.file;
          const bFile = b.source?.file;
          const aScope = aFile
            ? resolveFileScope(resolvePath(options.cwd, aFile), options.groupIndex)
            : ({ kind: "root" } as const);
          const bScope = bFile
            ? resolveFileScope(resolvePath(options.cwd, bFile), options.groupIndex)
            : ({ kind: "root" } as const);

          const delta = stepScopeRank(bScope) - stepScopeRank(aScope);
          return delta !== 0 ? delta : a.id.localeCompare(b.id);
        })
    : allSteps;

  const scopedStepsById = useScopedSteps
    ? (() => {
        const allowed = new Set(visibleSteps.map((step) => step.id));
        const next = new Map<string, (typeof visibleSteps)[number]>();
        for (const [id, def] of basePlan.stepsById.entries()) {
          if (allowed.has(id)) {
            next.set(id, def);
          }
        }
        return next;
      })()
    : basePlan.stepsById;

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
        steps: visibleSteps,
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
            steps: visibleSteps,
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
        steps: visibleSteps,
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
    steps: visibleSteps,
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
    stepsById: scopedStepsById,
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
  const cacheDir = options.cacheDir ?? await resolveCliCacheDir(cwd);
  const summaryFormatter = options.summaryFormatter ?? formatSummary;
  const { resolved } = await loadExecutorConfig(cwd, {
    cacheDir,
    ...(typeof options.environment === "string" && options.environment.trim().length > 0
      ? { environment: options.environment }
      : {}),
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
      ...(options.runnerArgs ? { runnerArgs: options.runnerArgs } : {}),
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

  const hasModuleSelection = (options.groups?.length ?? 0) > 0 || (options.modules?.length ?? 0) > 0;
  const hasExplicitPatterns = (options.patterns?.length ?? 0) > 0;

  if (hasExplicitPatterns && hasModuleSelection) {
    const patterns = [...(options.patterns ?? [])];

    const shouldWarn = (() => {
      const groups = executorConfig.modules?.groups;
      if (!groups) {
        return true;
      }

      // If groups were explicitly selected and we can determine group roots, only warn
      // when the provided patterns clearly extend beyond the allowed group roots.
      if ((options.groups?.length ?? 0) > 0) {
        const allowedGroups = new Set(options.groups);
        const allowedRoots = Object.entries(groups)
          .filter(([group]) => allowedGroups.has(group))
          .map(([, groupConfig]) => groupConfig.root);

        if (allowedRoots.length > 0) {
          return patterns.some((pattern) =>
            !allowedRoots.some((root) => patternIsUnderRoot(pattern, root))
          );
        }
      }

      // If we can't confidently assess scope, warn to avoid surprising runs.
      return true;
    })();

    if (shouldWarn) {
      // eslint-disable-next-line no-console -- CLI warning
      console.warn(
        "[autometa] Note: when you pass explicit feature patterns, they are used as-is. " +
          "Group/module filters (-g/-m) affect module/step loading, but do not automatically filter your feature patterns."
      );
    }
  }

  const patternSource = (() => {
    if (hasExplicitPatterns) {
      return [...(options.patterns ?? [])];
    }

    const roots = [...executorConfig.roots.features];

    // When the user opts into module selection (-g/-m), the expectation is typically
    // "run the selected modules" rather than "run everything including hoisted/root features".
    // So we narrow default feature discovery to module group roots.
    if (hasModuleSelection && executorConfig.modules?.groups) {
      const allowedGroups = (options.groups?.length ?? 0) > 0
        ? new Set(options.groups)
        : new Set(Object.keys(executorConfig.modules.groups));

      const allowedRoots = Object.entries(executorConfig.modules.groups)
        .filter(([group]) => allowedGroups.has(group))
        .map(([, groupConfig]) => groupConfig.root);

      const filtered = roots.filter((pattern) =>
        allowedRoots.some((root) => patternIsUnderRoot(pattern, root))
      );

      // If we couldn't confidently filter (e.g. unusual config), fall back to current behavior.
      if (filtered.length > 0) {
        return filtered;
      }
    }

    return roots;
  })();

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
  let stepsEnvironments: readonly RunnerStepsSurface<GlobalWorld>[] = [builder.steps()];

  const modulePlan = await createModulePlan(executorConfig, cwd);
  const compileOptions: Parameters<typeof compileModules>[1] = executorConfig.builder
    ? { cwd, cacheDir, builder: executorConfig.builder }
    : { cwd, cacheDir };
  const compileResult = await compileModules(modulePlan.orderedFiles, compileOptions);

  if (modulePlan.orderedFiles.length > 0) {
    const imported = await import(pathToFileURL(compileResult.bundlePath).href);
    const resolved = collectStepsEnvironments(imported);
    if (resolved.length > 0) {
      stepsEnvironments = resolved;
    }
  }

  const groupIndex = buildGroupIndex(executorConfig, cwd);
  const environmentIndex = indexStepsEnvironments(stepsEnvironments, cwd, groupIndex);

  for (const featurePath of featureFiles) {
    const feature = await readFeatureFile(featurePath, cwd);
    const featureAbsPath = resolvePath(cwd, featurePath);
    const selectedStepsEnvironment = resolveFeatureStepsEnvironment(
      featureAbsPath,
      feature,
      environmentIndex,
      groupIndex
    );

    // Keep legacy compatibility for any code that relies on CucumberRunner.steps().
    CucumberRunner.setSteps(selectedStepsEnvironment);

    const basePlan = selectedStepsEnvironment.getPlan();
    const scopePlan = createFeatureScopePlan(feature, basePlan, {
      featureAbsPath,
      cwd,
      config: executorConfig,
      groupIndex,
    });
    const coordinated = selectedStepsEnvironment.coordinateFeature({
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

function collectStepsEnvironments(imported: unknown): readonly RunnerStepsSurface<GlobalWorld>[] {
  const candidates = collectCandidateModules(imported);
  const environments = new Set<RunnerStepsSurface<GlobalWorld>>();
  for (const candidate of candidates) {
    const extracted = extractStepsEnvironments(candidate);
    for (const env of extracted) {
      environments.add(env);
    }
  }
  return Array.from(environments);
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

function extractStepsEnvironments(candidate: ModuleLike): readonly RunnerStepsSurface<GlobalWorld>[] {
  const environments: RunnerStepsSurface<GlobalWorld>[] = [];

  if (isStepsEnvironment(candidate)) {
    environments.push(candidate);
  }

  const steps = candidate.stepsEnvironment;
  if (isStepsEnvironment(steps)) {
    environments.push(steps);
  }

  const defaultExport = candidate.default;
  if (isStepsEnvironment(defaultExport)) {
    environments.push(defaultExport);
  }

  return environments;
}

type StepsEnvironmentIndexEntry =
  | { readonly kind: "root"; readonly environment: RunnerStepsSurface<GlobalWorld> }
  | { readonly kind: "group"; readonly group: string; readonly environment: RunnerStepsSurface<GlobalWorld> };

function inferEnvironmentGroup(
  environment: RunnerStepsSurface<GlobalWorld>,
  cwd: string,
  groupIndex: readonly GroupIndexEntry[]
): { readonly kind: "root" } | { readonly kind: "group"; readonly group: string } | { readonly kind: "ambiguous" } {
  const meta = (environment as unknown as Record<PropertyKey, unknown>)[STEPS_ENVIRONMENT_META] as
    | { readonly kind?: unknown; readonly group?: unknown }
    | undefined;
  if (meta?.kind === "group" && typeof meta.group === "string" && meta.group.trim().length > 0) {
    return { kind: "group", group: meta.group };
  }
  if (meta?.kind === "root") {
    return { kind: "root" };
  }

  const plan = environment.getPlan();
  const groups = new Set<string>();

  for (const step of plan.stepsById.values()) {
    const file = step.source?.file;
    if (!file) {
      continue;
    }
    const scope = resolveFileScope(resolvePath(cwd, file), groupIndex);
    if (scope.kind === "group" || scope.kind === "module") {
      groups.add(scope.group);
    }
    if (groups.size > 1) {
      return { kind: "ambiguous" };
    }
  }

  const only = Array.from(groups.values())[0];
  return only ? { kind: "group", group: only } : { kind: "root" };
}

function indexStepsEnvironments(
  environments: readonly RunnerStepsSurface<GlobalWorld>[],
  cwd: string,
  groupIndex: readonly GroupIndexEntry[]
): readonly StepsEnvironmentIndexEntry[] {
  const entries: StepsEnvironmentIndexEntry[] = [];
  for (const env of environments) {
    const inferred = inferEnvironmentGroup(env, cwd, groupIndex);
    if (inferred.kind === "ambiguous") {
      continue;
    }
    entries.push(
      inferred.kind === "group"
        ? { kind: "group", group: inferred.group, environment: env }
        : { kind: "root", environment: env }
    );
  }
  return entries;
}

function resolveFeatureStepsEnvironment(
  featureAbsPath: string,
  feature: SimpleFeature,
  environments: readonly StepsEnvironmentIndexEntry[],
  groupIndex: readonly GroupIndexEntry[]
): RunnerStepsSurface<GlobalWorld> {
  const featureScope = resolveFeatureScope(featureAbsPath, feature, groupIndex);
  if (featureScope.kind === "root") {
    const root = environments.find((entry) => entry.kind === "root");
    return root?.environment ?? environments[0]?.environment ?? CucumberRunner.steps<GlobalWorld>();
  }

  const group = featureScope.group;
  const match = environments.find((entry) => entry.kind === "group" && entry.group === group);
  if (match) {
    return match.environment;
  }

  const available = environments
    .filter((entry) => entry.kind === "group")
    .map((entry) => (entry as { kind: "group"; group: string }).group)
    .sort();

  throw new Error(
    `No steps environment found for group "${group}". Available groups: ${available.length > 0 ? available.join(", ") : "<none>"}`
  );
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
