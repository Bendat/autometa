/**
 * Bridge Code Generator for Playwright.
 *
 * Generates JavaScript/TypeScript code that transforms a Gherkin feature file
 * into a Playwright test suite using `test.describe` and `test()`.
 *
 * This is heavily based on the vitest-plugins transform but adapted for
 * Playwright's test runner and Node.js module loader hooks.
 */

import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import type { Config } from "@autometa/config";

const STEP_FALLBACK_GLOB = "**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}";

export interface BridgeGeneratorOptions {
  /** The absolute path to the .feature file */
  featurePath: string;
  /** The raw content of the .feature file */
  featureContent: string;
  /** The resolved autometa config (optional, will be loaded if not provided) */
  config?: Config;
  /** The path to the autometa config file */
  configPath?: string;
  /** The project root directory */
  projectRoot?: string;
}

/**
 * Resolve a package to its absolute file path.
 * This is needed because the generated code runs from the .feature file's location
 * which may not have access to node_modules.
 */
function resolvePackage(packageName: string, fromDir: string): string {
  try {
    const require = createRequire(resolve(fromDir, "package.json"));
    const resolved = require.resolve(packageName);
    
    // Check if we need to use ESM version
    // If the resolved path ends with .js, check if there's an .mjs version
    if (resolved.endsWith(".js") || resolved.endsWith("/index.js")) {
      const mjs = resolved.replace(/\.js$/, ".mjs");
      if (existsSync(mjs)) {
        return mjs;
      }
      // Also check for index.mjs in the same directory
      const indexMjs = resolved.replace(/index\.js$/, "index.mjs");
      if (indexMjs !== mjs && existsSync(indexMjs)) {
        return indexMjs;
      }
    }
    
    return resolved;
  } catch {
    // Fallback to bare specifier if resolution fails
    return packageName;
  }
}

/**
 * Generate Playwright bridge code for a .feature file.
 *
 * The generated code:
 * 1. Imports Playwright's test runner and Autometa executors
 * 2. Uses glob imports to load step definition modules
 * 3. Parses the feature file at runtime
 * 4. Coordinates the runner and executes tests
 *
 * @param featurePath - Absolute path to the .feature file
 * @param featureContent - Raw content of the .feature file
 * @param runtimeProjectRoot - The project root where packages should be resolved from (usually process.cwd())
 * @returns Generated ESM module code
 */
export function generateBridgeCode(
  featurePath: string,
  featureContent: string,
  runtimeProjectRoot?: string
): string {
  // Use runtime project root if provided, otherwise try to find it from feature path
  const projectRoot = runtimeProjectRoot ?? findProjectRoot(dirname(featurePath));

  // Find and load the autometa config to get step roots
  const { configPath, stepRoots } = loadConfigSync(projectRoot);
  const configDir = configPath ? dirname(configPath) : projectRoot;

  // Build step file patterns for dynamic import
  const stepPatterns = buildStepPatterns(stepRoots, {
    configDir,
    projectRoot,
  });

  // Generate import statements for step modules
  const stepImports = generateStepImports(stepPatterns, projectRoot);

  // Resolve package paths from project root so imports work from any location
  const playwrightPath = resolvePackage("@playwright/test", projectRoot);
  const executorPath = resolvePackage("@autometa/playwright-executor", projectRoot);
  const runnerPath = resolvePackage("@autometa/runner", projectRoot);
  const gherkinPath = resolvePackage("@autometa/gherkin", projectRoot);

  // Log the step patterns for debugging
  const debugInfo = JSON.stringify({
    projectRoot,
    configPath,
    stepRoots,
    stepPatterns,
  }, null, 2);

  // Generate the bridge code that Playwright will execute
  return `
import { test } from ${JSON.stringify(playwrightPath)};
import { execute } from ${JSON.stringify(executorPath)};
import { coordinateRunnerFeature, CucumberRunner } from ${JSON.stringify(runnerPath)};
import { parseGherkin } from ${JSON.stringify(gherkinPath)};

const debugFlagValue = typeof process !== 'undefined'
  ? (process.env.AUTOMETA_BRIDGE_DEBUG ?? process.env.AUTOMETA_DEBUG ?? '')
  : '';
const debugEnabled = (() => {
  if (!debugFlagValue) {
    return false;
  }
  const normalized = String(debugFlagValue).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
})();
const debugLog = (...args) => {
  if (!debugEnabled) {
    return;
  }
  console.log(...args);
};

// Debug: Step discovery configuration
debugLog("[Autometa Bridge] Step discovery info:", ${JSON.stringify(debugInfo)});

// Dynamic imports for step definition modules
${stepImports}

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
  for (const moduleExports of Object.values(modules)) {
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

const gherkin = ${JSON.stringify(featureContent)};
const feature = parseGherkin(gherkin);
const stepModules = await loadStepModules();
const steps = resolveStepsEnvironment(stepModules);

if (!steps) {
  throw new Error(
    'Autometa could not find an exported steps environment for the configured step roots. ' +
    'Export your runner environment as "stepsEnvironment" or default.'
  );
}

// Debug: Check the steps environment
debugLog("[Autometa Bridge] Steps environment found:", {
  hasGiven: typeof steps.Given === 'function',
  hasWhen: typeof steps.When === 'function', 
  hasThen: typeof steps.Then === 'function',
  hasGetPlan: typeof steps.getPlan === 'function',
});

CucumberRunner.setSteps(steps);

const runtimeConfig = steps.getConfig?.() ?? {
  test: {},
  shim: {},
  globals: {}
};

// Debug: Check the plan
const basePlan = steps.getPlan();
const paramRegistry = basePlan.parameterRegistry;
const actualRegistry = paramRegistry?.registry ?? paramRegistry;
const paramTypeNames = actualRegistry?.parameterTypes 
  ? Array.from(actualRegistry.parameterTypes).map(pt => pt.name)
  : [];
debugLog("[Autometa Bridge] Base plan:", {
  stepsCount: basePlan.stepsById?.size ?? 0,
  hooksCount: basePlan.hooksById?.size ?? 0,
  hasParameterRegistry: Boolean(paramRegistry),
  parameterTypes: paramTypeNames,
  hasHttpMethod: actualRegistry?.lookupByTypeName?.('httpMethod') !== undefined,
  stepIds: Array.from(basePlan.stepsById?.keys() ?? []).slice(0, 5),
});

// Debug: Check step module contents
debugLog("[Autometa Bridge] Step modules keys:", Object.keys(stepModules));
const firstModKey = Object.keys(stepModules)[0];
if (firstModKey) {
  const firstMod = stepModules[firstModKey];
  debugLog("[Autometa Bridge] First module exports:", Object.keys(firstMod ?? {}));
}

test.describe(feature.name, () => {
  const scopedPlan = createFeatureScopePlan(feature, basePlan);
  
  // Debug: Check the scoped plan
  const scopedRegistry = scopedPlan.parameterRegistry?.registry ?? scopedPlan.parameterRegistry;
  debugLog("[Autometa Bridge] Scoped plan:", {
    hasParameterRegistry: Boolean(scopedPlan.parameterRegistry),
    hasHttpMethod: scopedRegistry?.lookupByTypeName?.('httpMethod') !== undefined,
    rootChildren: scopedPlan.root?.children?.length ?? 0,
    stepsCount: scopedPlan.stepsById?.size ?? 0,
  });

  // Debug: Feature name matching
  debugLog("[Autometa Bridge] Feature matching:", {
    gherkinName: feature.name,
    featureScopeNames: scopedPlan.root?.children?.filter(c => c.kind === 'feature').map(c => c.name) ?? [],
  });
  
  const { plan, adapter } = coordinateRunnerFeature({
    feature,
    environment: steps,
    config: runtimeConfig,
    plan: scopedPlan
  });

  // Debug: Check what adapter sees
  const adapterRegistry = adapter.getParameterRegistry?.();
  const actualAdapterReg = adapterRegistry?.registry ?? adapterRegistry;
  debugLog("[Autometa Bridge] Adapter:", {
    hasParameterRegistry: Boolean(adapterRegistry),
    hasHttpMethod: actualAdapterReg?.lookupByTypeName?.('httpMethod') !== undefined,
  });

  execute({ plan, adapter, config: runtimeConfig });
});
`;
}

/**
 * Find the project root by looking for package.json
 */
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== "/") {
    if (existsSync(resolve(dir, "package.json"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

/**
 * Synchronously load autometa config to find step roots.
 * Note: This is synchronous because Node.js loader hooks are synchronous.
 */
function loadConfigSync(
  root: string
): { configPath: string | undefined; stepRoots: string[] } {
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
    if (existsSync(path)) {
      // We can't actually load the config synchronously with TypeScript
      // So we'll use a convention-based approach: look for src/steps directory
      const defaultStepRoots = findDefaultStepRoots(root);
      return { configPath: path, stepRoots: defaultStepRoots };
    }
  }

  // No config found, use default step roots
  const defaultStepRoots = findDefaultStepRoots(root);
  return { configPath: undefined, stepRoots: defaultStepRoots };
}

/**
 * Find default step definition directories.
 */
function findDefaultStepRoots(root: string): string[] {
  const candidates = [
    "src/steps",
    "src/step-definitions",
    "steps",
    "step-definitions",
    "src",
  ];

  const found: string[] = [];
  for (const candidate of candidates) {
    const path = resolve(root, candidate);
    if (existsSync(path)) {
      found.push(candidate);
      break; // Use first match
    }
  }

  // Also check for a main step-definitions.ts file
  const stepDefFile = resolve(root, "src/step-definitions.ts");
  if (existsSync(stepDefFile)) {
    found.push("src/step-definitions.ts");
  }

  return found.length > 0 ? found : ["src"];
}

interface StepPatternOptions {
  readonly configDir: string;
  readonly projectRoot: string;
}

/**
 * Build step file patterns from step roots.
 */
function buildStepPatterns(
  entries: readonly string[],
  options: StepPatternOptions
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

      // For Playwright loader, we need actual file paths not globs
      // Resolve the glob to actual files
      const files = resolveGlobToFiles(absolute, options.projectRoot);
      for (const file of files) {
        patterns.add(file);
      }
    }
  }

  return Array.from(patterns);
}

/**
 * Resolve a glob pattern to actual file paths.
 */
function resolveGlobToFiles(pattern: string, projectRoot: string): string[] {
  // For simplicity, we'll convert glob patterns to directory scanning
  // Real implementation would use a glob library

  // Check if it's a specific file (not a glob pattern)
  const isSpecificFile = hasFileExtension(pattern) && !hasGlobMagic(pattern);
  if (isSpecificFile) {
    // It's a specific file, just return it if it exists
    if (existsSync(pattern)) {
      return [pattern];
    }
    return [];
  }

  // Extract the base directory from the pattern
  const globIndex = pattern.search(/[*?{}[\]]/);
  const baseDir =
    globIndex === -1
      ? pattern
      : pattern.slice(0, pattern.lastIndexOf("/", globIndex) + 1);

  if (!existsSync(baseDir)) {
    return [];
  }

  const files: string[] = [];
  const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"];

  function scanDir(dir: string): void {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = resolve(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          scanDir(fullPath);
        } else if (entry.isFile()) {
          const ext = extname(entry.name);
          if (extensions.includes(ext) && !entry.name.includes(".test.") && !entry.name.includes(".spec.")) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Ignore errors
    }
  }

  scanDir(baseDir.replace(/\/+$/, ""));
  return files;
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
  const trimmed =
    normalized === "/" ? normalized : normalized.replace(/\/+$/u, "");
  if (!trimmed || trimmed === "." || trimmed === "..") {
    return false;
  }
  return Boolean(extname(trimmed));
}

function appendGlob(entry: string, glob: string): string {
  const normalized = normalizeSlashes(entry);
  const trimmed =
    normalized === "/" ? normalized : normalized.replace(/\/+$/u, "");
  if (!trimmed || trimmed === ".") {
    return glob;
  }
  if (trimmed === "/") {
    return `/${glob}`;
  }
  return `${trimmed}/${glob}`;
}

function normalizeSlashes(pathname: string): string {
  return pathname.replace(/\\/gu, "/");
}

/**
 * Generate dynamic import statements for step modules.
 */
function generateStepImports(
  stepPatterns: string[],
  _projectRoot: string
): string {
  if (stepPatterns.length === 0) {
    return `
async function loadStepModules() {
  return {};
}
`;
  }

  // Sort patterns to ensure main step-definitions files are loaded first
  // Files named "step-definitions.ts" or similar should come first
  // Then index files, then everything else
  const sortedPatterns = [...stepPatterns].sort((a, b) => {
    const aName = a.toLowerCase();
    const bName = b.toLowerCase();
    
    // Main step definition files first
    const aIsMain = aName.includes('step-definitions.ts') || aName.includes('step-definitions.js');
    const bIsMain = bName.includes('step-definitions.ts') || bName.includes('step-definitions.js');
    if (aIsMain && !bIsMain) return -1;
    if (!aIsMain && bIsMain) return 1;
    
    // Index files next
    const aIsIndex = aName.endsWith('/index.ts') || aName.endsWith('/index.js');
    const bIsIndex = bName.endsWith('/index.ts') || bName.endsWith('/index.js');
    if (aIsIndex && !bIsIndex) return -1;
    if (!aIsIndex && bIsIndex) return 1;
    
    return a.localeCompare(b);
  });

  const imports = sortedPatterns
    .map((file, index) => {
      const importPath = normalizeSlashes(file);
      return `  const mod${index} = await import(${JSON.stringify(importPath)});`;
    })
    .join("\n");

  const moduleMap = sortedPatterns
    .map((file, index) => {
      const key = normalizeSlashes(file);
      return `    ${JSON.stringify(key)}: mod${index},`;
    })
    .join("\n");

  return `
async function loadStepModules() {
${imports}
  return {
${moduleMap}
  };
}
`;
}

/**
 * Escape a string for use in generated code.
 */
export function escapeString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}
