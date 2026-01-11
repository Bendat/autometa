import { resolve, isAbsolute, relative, dirname, extname } from "path";
import { existsSync, readFileSync } from "fs";
import type { Config } from "@autometa/config";
import jiti from "jiti";

const STEP_FALLBACK_GLOB = "**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}";

/**
 * Jest transformer options that can be passed via jest.config.js
 */
export interface JestTransformerOptions {
  /**
   * Path to the autometa config file. If not provided, will search for
   * autometa.config.{ts,js,mts,mjs,cts,cjs} in the project root.
   */
  readonly configPath?: string;
}

interface TransformOptions {
  readonly config: {
    readonly rootDir: string;
  };
  readonly transformerConfig?: JestTransformerOptions;
}

interface TransformResult {
  readonly code: string;
  readonly map?: unknown;
}

interface StepGlobOptions {
  readonly configDir: string;
  readonly projectRoot: string;
}

let cachedConfig: { config: Config; path: string } | undefined;
let cachedProjectRoot: string | undefined;

/**
 * Jest transformer for .feature files.
 * Converts Gherkin feature files into Jest test suites.
 */
export function process(
  sourceText: string,
  sourcePath: string,
  options: TransformOptions
): TransformResult {
  const projectRoot = options.config.rootDir;

  // Load config if not cached or project root changed
  if (!cachedConfig || cachedProjectRoot !== projectRoot) {
    const configPath = options.transformerConfig?.configPath;
    cachedConfig = loadAutometaConfig(projectRoot, configPath);
    cachedProjectRoot = projectRoot;
  }

  const autometaConfig = cachedConfig.config;
  const configPath = cachedConfig.path;

  const resolved = autometaConfig.resolve();
  const stepRoots = resolved.config.roots.steps;
  const configDir = configPath ? dirname(configPath) : projectRoot;
  
  const stepGlobs = buildStepGlobs(stepRoots, {
    configDir,
    projectRoot,
  });

  if (stepGlobs.length === 0) {
    throw new Error(
      "Autometa config did not resolve any step files within the current project root."
    );
  }

  // For Jest, we need to use require.context or manual requires
  // Since Jest doesn't have import.meta.glob, we generate explicit requires
  const eventRequires = generateEventRequires(resolved.config.events, configDir);
  const stepRequires = generateStepRequires(stepRoots, configDir, projectRoot);
  const runtimeConfig = JSON.stringify(resolved.config);
  const gherkinContent = JSON.stringify(sourceText);

  const code = `
const { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } = require('@jest/globals');
const { execute } = require('@autometa/jest-executor');
const { coordinateRunnerFeature, CucumberRunner } = require('@autometa/runner');
const { parseGherkin } = require('@autometa/gherkin');

${eventRequires}
${stepRequires}

function collectCandidateModules(imported) {
  if (!imported || typeof imported !== 'object') {
    return [];
  }

  const modules = new Set();
  modules.add(imported);

  const exportedModules = imported.modules;
  if (Array.isArray(exportedModules)) {
    for (const entry of exportedModules) {
      if (entry && typeof entry === 'object') {
        modules.add(entry);
      }
    }
  }

  const defaultExport = imported.default;
  if (Array.isArray(defaultExport)) {
    for (const entry of defaultExport) {
      if (entry && typeof entry === 'object') {
        modules.add(entry);
      }
    }
  } else if (defaultExport && typeof defaultExport === 'object') {
    modules.add(defaultExport);
  }

  return Array.from(modules);
}

function isStepsEnvironment(candidate) {
  return Boolean(
    candidate &&
    typeof candidate === 'object' &&
    typeof candidate.coordinateFeature === 'function' &&
    typeof candidate.getPlan === 'function' &&
    typeof candidate.Given === 'function' &&
    typeof candidate.When === 'function' &&
    typeof candidate.Then === 'function'
  );
}

function extractStepsEnvironment(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return undefined;
  }

  if (isStepsEnvironment(candidate)) {
    return candidate;
  }

  const stepsEnv = candidate.stepsEnvironment;
  if (isStepsEnvironment(stepsEnv)) {
    return stepsEnv;
  }

  const defaultExport = candidate.default;
  if (isStepsEnvironment(defaultExport)) {
    return defaultExport;
  }

  return undefined;
}

function resolveStepsEnvironment(modules) {
  for (const moduleExports of modules) {
    for (const candidate of collectCandidateModules(moduleExports)) {
      const environment = extractStepsEnvironment(candidate);
      if (environment) {
        return environment;
      }
    }
  }
  return undefined;
}

function isScenario(element) {
  return Boolean(
    element &&
    typeof element === 'object' &&
    'steps' in element &&
    !('exampleGroups' in element) &&
    !('elements' in element)
  );
}

function isScenarioOutline(element) {
  return Boolean(
    element &&
    typeof element === 'object' &&
    'steps' in element &&
    'exampleGroups' in element
  );
}

function isRule(element) {
  return Boolean(
    element &&
    typeof element === 'object' &&
    'elements' in element &&
    Array.isArray(element.elements)
  );
}

function createFeatureScopePlan(feature, basePlan) {
  const allSteps = Array.from(basePlan.stepsById.values());
  const featureChildren = [];
  const scopesById = new Map(basePlan.scopesById);

  for (const element of feature.elements ?? []) {
    if (isScenario(element) || isScenarioOutline(element)) {
      const scenarioScope = {
        id: element.id ?? element.name,
        kind: isScenarioOutline(element) ? 'scenarioOutline' : 'scenario',
        name: element.name,
        mode: 'default',
        tags: element.tags ?? [],
        steps: allSteps,
        hooks: [],
        children: [],
        pending: false,
      };
      featureChildren.push(scenarioScope);
      scopesById.set(scenarioScope.id, scenarioScope);
      continue;
    }

    if (isRule(element)) {
      const ruleChildren = [];
      for (const ruleElement of element.elements ?? []) {
        if (isScenario(ruleElement) || isScenarioOutline(ruleElement)) {
          const scenarioScope = {
            id: ruleElement.id ?? ruleElement.name,
            kind: isScenarioOutline(ruleElement) ? 'scenarioOutline' : 'scenario',
            name: ruleElement.name,
            mode: 'default',
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

      const ruleScope = {
        id: element.id ?? element.name,
        kind: 'rule',
        name: element.name,
        mode: 'default',
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

  const featureScope = {
    id: feature.uri ?? feature.name,
    kind: 'feature',
    name: feature.name,
    mode: 'default',
    tags: feature.tags ?? [],
    steps: allSteps,
    hooks: [],
    children: featureChildren,
    pending: false,
  };

  const existingRoot = basePlan.root;
  const updatedRoot = {
    ...existingRoot,
    children: [...existingRoot.children, featureScope],
  };

  scopesById.set(featureScope.id, featureScope);
  scopesById.set(updatedRoot.id, updatedRoot);

  const scopePlan = {
    root: updatedRoot,
    stepsById: basePlan.stepsById,
    hooksById: basePlan.hooksById,
    scopesById,
  };

  if (basePlan.worldFactory) {
    scopePlan.worldFactory = basePlan.worldFactory;
  }

  if (basePlan.parameterRegistry) {
    scopePlan.parameterRegistry = basePlan.parameterRegistry;
  }

  return scopePlan;
}

const gherkin = ${gherkinContent};
const feature = parseGherkin(gherkin);
const steps = resolveStepsEnvironment(stepModules);

if (!steps) {
  throw new Error('Autometa could not find an exported steps environment for the configured step roots. Export your runner environment as "stepsEnvironment" or default.');
}

CucumberRunner.setSteps(steps);

describe(feature.name, () => {
  const basePlan = steps.getPlan();
  const scopedPlan = createFeatureScopePlan(feature, basePlan);
  const { plan, adapter } = coordinateRunnerFeature({
    feature,
    environment: steps,
    config: ${runtimeConfig},
    plan: scopedPlan
  });

  execute({ plan, adapter, config: ${runtimeConfig} });
});
`;

  return { code };
}

/**
 * Generate require statements for step definition files.
 * Since Jest doesn't have import.meta.glob, we need to explicitly require files.
 * Uses absolute paths to ensure require works from any feature file location.
 */
function generateStepRequires(
  stepRoots: readonly string[] | undefined,
  configDir: string,
  _projectRoot: string
): string {
  if (!stepRoots || stepRoots.length === 0) {
    return "const stepModules = [];";
  }

  const requires: string[] = [];
  let moduleIndex = 0;

  for (const root of stepRoots) {
    const normalizedRoot = root.trim();
    if (!normalizedRoot) {
      continue;
    }

    // Resolve the step root path to absolute
    const absolutePath = isAbsolute(normalizedRoot)
      ? normalizedRoot
      : resolve(configDir, normalizedRoot);

    // Check if it's a file or directory
    if (existsSync(absolutePath)) {
      // Use absolute path to ensure require works from any feature file location
      const normalizedAbsolutePath = normalizeSlashes(absolutePath);
      requires.push(`const stepModule${moduleIndex} = require('${normalizedAbsolutePath}');`);
      moduleIndex++;
    }
  }

  if (requires.length === 0) {
    return "const stepModules = [];";
  }

  const moduleList = Array.from({ length: moduleIndex }, (_, i) => `stepModule${i}`).join(", ");
  return `${requires.join("\n")}\nconst stepModules = [${moduleList}];`;
}

/**
 * Generate require statements for event listener modules.
 * These modules are imported for side effects (e.g. registering listeners).
 */
function generateEventRequires(
  eventModules: readonly string[] | undefined,
  configDir: string
): string {
  if (!eventModules || eventModules.length === 0) {
    return "";
  }

  const requires: string[] = [];

  for (const entry of eventModules) {
    const normalized = entry.trim();
    if (!normalized) {
      continue;
    }

    const absolutePath = isAbsolute(normalized)
      ? normalized
      : resolve(configDir, normalized);

    if (!existsSync(absolutePath)) {
      continue;
    }

    const normalizedAbsolutePath = normalizeSlashes(absolutePath);
    requires.push(`require('${normalizedAbsolutePath}');`);
  }

  return requires.length > 0 ? requires.join("\n") : "";
}

function buildStepGlobs(
  entries: readonly string[] | undefined,
  options: StepGlobOptions
): string[] {
  if (!entries || entries.length === 0) {
    return [];
  }

  const patterns = new Set<string>();
  for (const entry of entries) {
    const normalized = entry.trim();
    if (!normalized) {
      continue;
    }

    for (const candidate of toPatterns(normalized, STEP_FALLBACK_GLOB)) {
      const absolute = isAbsolute(candidate)
        ? normalizeSlashes(candidate)
        : normalizeSlashes(resolve(options.configDir, candidate));
      const rootRelative = toRootRelativeGlob(absolute, options.projectRoot);
      patterns.add(rootRelative);
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
  return /[*?{}()[\]!,@+]/u.test(input);
}

function hasFileExtension(input: string): boolean {
  const normalized = normalizeSlashes(input);
  const trimmed = normalized === "/" ? normalized : normalized.replace(/\/+$/u, "");
  if (!trimmed || trimmed === "." || trimmed === "..") {
    return false;
  }
  return Boolean(extname(trimmed));
}

function appendGlob(entry: string, glob: string): string {
  const normalized = normalizeSlashes(entry);
  const trimmed = normalized === "/" ? normalized : normalized.replace(/\/+$/u, "");
  if (!trimmed || trimmed === ".") {
    return glob;
  }
  if (trimmed === "/") {
    return `/${glob}`;
  }
  return `${trimmed}/${glob}`;
}

function toRootRelativeGlob(pattern: string, rootDir: string): string {
  const normalizedRoot = normalizeSlashes(rootDir);
  const normalizedPattern = normalizeSlashes(pattern);
  let relativePattern = normalizeSlashes(relative(normalizedRoot, normalizedPattern));

  if (!relativePattern || relativePattern === ".") {
    relativePattern = "";
  }

  if (!relativePattern || relativePattern.startsWith("..")) {
    return ensureGlobPrefix(normalizedPattern);
  }

  return ensureGlobPrefix(relativePattern);
}

function ensureGlobPrefix(pattern: string): string {
  if (/^[A-Za-z]:\//u.test(pattern)) {
    return pattern;
  }
  if (pattern.startsWith("/")) {
    return pattern;
  }
  return `/${pattern.replace(/^\/+/, "")}`;
}

function normalizeSlashes(pathname: string): string {
  return pathname.replace(/\\/gu, "/");
}

function loadAutometaConfig(
  root: string,
  explicitPath?: string
): { config: Config; path: string } {
  const _jiti = jiti(root, { interopDefault: true });

  if (explicitPath) {
    const absolutePath = isAbsolute(explicitPath)
      ? explicitPath
      : resolve(root, explicitPath);

    if (!existsSync(absolutePath)) {
      throw new Error(`Autometa config not found at ${absolutePath}`);
    }

    const mod = _jiti(absolutePath);
    const config = mod.default || mod;

    if (!isConfig(config)) {
      throw new Error(`Config at ${absolutePath} does not export a valid Config instance.`);
    }

    return { config, path: absolutePath };
  }

  const candidates = [
    "autometa.config.ts",
    "autometa.config.js",
    "autometa.config.mts",
    "autometa.config.mjs",
    "autometa.config.cts",
    "autometa.config.cjs",
  ];

  for (const candidate of candidates) {
    const path = resolve(root, candidate);
    if (!existsSync(path)) {
      continue;
    }

    try {
      const mod = _jiti(path);
      const config = mod.default || mod;

      if (isConfig(config)) {
        return { config, path };
      } else {
        console.warn(`Found config at ${path} but it does not export a Config instance.`);
      }
    } catch (error: unknown) {
      console.error(`Error loading config at ${path}:`, error);
      throw error;
    }
  }

  throw new Error("Could not find autometa.config.{ts,js,mjs,cjs} in " + root);
}

function isConfig(config: unknown): config is Config {
  return (
    typeof config === "object" &&
    config !== null &&
    "resolve" in config &&
    typeof (config as Config).resolve === "function" &&
    "current" in config &&
    typeof (config as Config).current === "function"
  );
}

/**
 * Default export for Jest transformer compatibility.
 * Jest expects the transformer to have a `process` method.
 */
export default {
  process,
};
