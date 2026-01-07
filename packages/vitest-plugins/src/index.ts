import { resolve, isAbsolute, relative, dirname, extname } from "path";
import { existsSync } from "fs";
import type { Plugin } from "vite";
import type { Config } from "@autometa/config";
import jiti from "jiti";

const STEP_FALLBACK_GLOB = "**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}";

type ModuleDeclaration =
  | string
  | { readonly name: string; readonly submodules?: readonly ModuleDeclaration[] | undefined };

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

  const unique = new Map<string, readonly string[]>();
  for (const path of results) {
    unique.set(path.join("/"), path);
  }

  return Array.from(unique.values()).sort((a, b) => b.length - a.length);
}

function buildStepScopingData(resolvedConfig: any, projectRoot: string): unknown {
  const groups = resolvedConfig?.modules?.groups;
  if (!groups || typeof groups !== "object") {
    return null;
  }

  const entries = Object.entries(groups).map(([group, groupConfig]: any) => {
    const rootAbs = resolve(projectRoot, String(groupConfig.root));
    const modulePaths = flattenModuleDeclarations(groupConfig.modules as ModuleDeclaration[]);
    return { group, rootAbs, modulePaths };
  });

  return { groups: entries };
}

export function autometa(): Plugin {
  let autometaConfig: Config | undefined;
  let configPath: string | undefined;
  let projectRoot: string | undefined;

  return {
    name: "autometa-vitest-plugin",
    enforce: "pre",
    async configResolved(viteConfig) {
      projectRoot = viteConfig.root || process.cwd();
      const loaded = await loadAutometaConfig(projectRoot);
      autometaConfig = loaded.config;
      configPath = loaded.path;
    },
    transform(code, id) {
      if (id.endsWith(".feature")) {
        if (!autometaConfig) {
          throw new Error("Autometa config not found");
        }

        const resolved = autometaConfig.resolve();
        const stepRoots = resolved.config.roots.steps;
        const configDir = configPath ? dirname(configPath) : projectRoot ?? process.cwd();
        const rootDir = projectRoot ?? process.cwd();
        const stepGlobs = buildStepGlobs(stepRoots, {
          configDir,
          projectRoot: rootDir,
        });
        if (stepGlobs.length === 0) {
          throw new Error(
            "Autometa config did not resolve any step files within the current project root."
          );
        }

        const runtimeConfig = JSON.stringify(resolved.config);
        const stepScopingMode = resolved.config.modules?.stepScoping ?? "global";

        // Group/module index data is useful even when step scoping is disabled,
        // since we may need it to select the correct steps environment.
        const groupIndexData = buildStepScopingData(resolved.config, rootDir);
        const stepScopingData = stepScopingMode === "scoped" ? groupIndexData : null;

        const featureFile = id;

        return {
          code: `
            import { describe } from 'vitest';
            import { execute } from '@autometa/vitest-executor';
            import { coordinateRunnerFeature, CucumberRunner, STEPS_ENVIRONMENT_META } from '@autometa/runner';
            import { parseGherkin } from '@autometa/gherkin';
            import { relative as __pathRelative, resolve as __pathResolve, isAbsolute as __pathIsAbsolute } from 'node:path';

            const __AUTOMETA_STEP_SCOPING_MODE = ${JSON.stringify(stepScopingMode)};
            const __AUTOMETA_GROUP_INDEX = ${JSON.stringify(groupIndexData)};
            const __AUTOMETA_STEP_SCOPING = ${JSON.stringify(stepScopingData)};
            const __AUTOMETA_FEATURE_FILE = ${JSON.stringify(featureFile)};

            const stepModules = import.meta.glob(${JSON.stringify(stepGlobs)}, { eager: true });

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

            function extractStepsEnvironments(candidate) {
              const environments = [];

              if (!candidate || typeof candidate !== 'object') {
                return environments;
              }

              if (isStepsEnvironment(candidate)) {
                environments.push(candidate);
              }

              const stepsEnv = candidate.stepsEnvironment;
              if (isStepsEnvironment(stepsEnv)) {
                environments.push(stepsEnv);
              }

              const defaultExport = candidate.default;
              if (isStepsEnvironment(defaultExport)) {
                environments.push(defaultExport);
              }

              return environments;
            }

            function collectStepsEnvironments(modules) {
              const environments = new Set();
              for (const moduleExports of Object.values(modules)) {
                for (const candidate of collectCandidateModules(moduleExports)) {
                  for (const env of extractStepsEnvironments(candidate)) {
                    environments.add(env);
                  }
                }
              }
              return Array.from(environments);
            }

            function __normalizePathSegments(input) {
              return String(input).replace(/\\/g, '/').split('/').filter(Boolean);
            }

            function __startsWithSegments(haystack, needle) {
              if (needle.length > haystack.length) return false;
              for (let i = 0; i < needle.length; i += 1) {
                if (haystack[i] !== needle[i]) return false;
              }
              return true;
            }

            function __resolveFileScope(fileAbs) {
              if (!__AUTOMETA_GROUP_INDEX || !__AUTOMETA_GROUP_INDEX.groups) {
                return { kind: 'root' };
              }
              if (String(fileAbs).startsWith('node:')) {
                return { kind: 'root' };
              }

              const absoluteFile = __pathIsAbsolute(String(fileAbs))
                ? String(fileAbs)
                : __pathResolve(process.cwd(), String(fileAbs));

              for (const entry of __AUTOMETA_GROUP_INDEX.groups) {
                const rootAbs = entry.rootAbs;
                const rel = rootAbs ? __pathRelative(rootAbs, absoluteFile) : '';
                if (rel === '' || (!rel.startsWith('..') && !rel.startsWith('../') && !rel.startsWith('..\\'))) {
                  const segments = __normalizePathSegments(rel);
                  const modulePaths = entry.modulePaths || [];
                  for (const modulePath of modulePaths) {
                    if (__startsWithSegments(segments, modulePath)) {
                      return { kind: 'module', group: entry.group, modulePath };
                    }
                  }
                  return { kind: 'group', group: entry.group };
                }
              }
              return { kind: 'root' };
            }

            function __parseScopeOverrideTag(tags) {
              if (!Array.isArray(tags)) return undefined;
              for (const tag of tags) {
                const match = String(tag).match(/^@scope(?::|=|\()(.+?)(?:\))?$/u);
                if (!match) continue;
                const raw = String(match[1] ?? '').trim();
                if (!raw) continue;
                const normalized = raw.replace(/\//g, ':');
                const parts = normalized.split(':').filter(Boolean);
                const group = parts[0];
                const rest = parts.slice(1);
                if (!group) continue;
                return rest.length > 0 ? { group, modulePath: rest } : { group };
              }
              return undefined;
            }

            function __resolveFeatureScope(feature) {
              const override = __parseScopeOverrideTag(feature.tags);
              if (override) {
                if (override.modulePath && override.modulePath.length > 0) {
                  return { kind: 'module', group: override.group, modulePath: override.modulePath };
                }
                return { kind: 'group', group: override.group };
              }
              return __resolveFileScope(__AUTOMETA_FEATURE_FILE);
            }

            function __inferEnvironmentGroup(environment) {
              const meta = environment && typeof environment === 'object'
                ? environment[STEPS_ENVIRONMENT_META]
                : undefined;
              if (meta && typeof meta === 'object') {
                if (meta.kind === 'group' && typeof meta.group === 'string' && meta.group.trim().length > 0) {
                  return { kind: 'group', group: meta.group };
                }
                if (meta.kind === 'root') {
                  return { kind: 'root' };
                }
              }

              const plan = environment.getPlan();
              const groups = new Set();
              for (const def of plan.stepsById.values()) {
                const file = def && def.source ? def.source.file : undefined;
                if (!file) continue;
                const scope = __resolveFileScope(file);
                if (scope.kind === 'group' || scope.kind === 'module') {
                  groups.add(scope.group);
                  if (groups.size > 1) return { kind: 'ambiguous' };
                }
              }
              const only = Array.from(groups.values())[0];
              return only ? { kind: 'group', group: only } : { kind: 'root' };
            }

            function selectStepsEnvironment(environments, feature) {
              if (!Array.isArray(environments) || environments.length === 0) {
                return undefined;
              }
              if (environments.length === 1) {
                return environments[0];
              }

              const featureScope = __resolveFeatureScope(feature);
              const indexed = environments
                .map((env) => ({ env, inferred: __inferEnvironmentGroup(env) }))
                .filter((entry) => entry.inferred.kind !== 'ambiguous');

              if (featureScope.kind === 'root') {
                const root = indexed.find((entry) => entry.inferred.kind === 'root');
                return (root ? root.env : indexed[0]?.env) ?? environments[0];
              }

              const match = indexed.find((entry) => entry.inferred.kind === 'group' && entry.inferred.group === featureScope.group);
              return match ? match.env : undefined;
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

              function normalizePathSegments(input) {
                return String(input).replace(/\\\\/g, '/').split('/').filter(Boolean);
              }

              function startsWithSegments(haystack, needle) {
                if (needle.length > haystack.length) return false;
                for (let i = 0; i < needle.length; i += 1) {
                  if (haystack[i] !== needle[i]) return false;
                }
                return true;
              }

              function resolveFileScope(fileAbs) {
                if (!__AUTOMETA_STEP_SCOPING || !__AUTOMETA_STEP_SCOPING.groups) {
                  return { kind: 'root' };
                }
                if (String(fileAbs).startsWith('node:')) {
                  return { kind: 'root' };
                }

                const absoluteFile = __pathIsAbsolute(String(fileAbs))
                  ? String(fileAbs)
                  : __pathResolve(process.cwd(), String(fileAbs));

                for (const entry of __AUTOMETA_STEP_SCOPING.groups) {
                  const rootAbs = entry.rootAbs;
                  const rel = rootAbs ? __pathRelative(rootAbs, absoluteFile) : '';
                  if (rel === '' || (!rel.startsWith('..') && !rel.startsWith('../') && !rel.startsWith('..\\\\'))) {
                    const segments = normalizePathSegments(rel);
                    const modulePaths = entry.modulePaths || [];
                    for (const modulePath of modulePaths) {
                      if (startsWithSegments(segments, modulePath)) {
                        return { kind: 'module', group: entry.group, modulePath };
                      }
                    }
                    return { kind: 'group', group: entry.group };
                  }
                }
                return { kind: 'root' };
              }

              function parseScopeOverrideTag(tags) {
                if (!Array.isArray(tags)) return undefined;
                for (const tag of tags) {
                  const match = String(tag).match(/^@scope(?::|=|\()(.+?)(?:\))?$/u);
                  if (!match) continue;
                  const raw = String(match[1] ?? '').trim();
                  if (!raw) continue;
                  const normalized = raw.replace(/\//g, ':');
                  const parts = normalized.split(':').filter(Boolean);
                  const group = parts[0];
                  const rest = parts.slice(1);
                  if (!group) continue;
                  return rest.length > 0 ? { group, modulePath: rest } : { group };
                }
                return undefined;
              }

              function resolveFeatureScope() {
                const override = parseScopeOverrideTag(feature.tags);
                if (override) {
                  if (override.modulePath && override.modulePath.length > 0) {
                    return { kind: 'module', group: override.group, modulePath: override.modulePath };
                  }
                  return { kind: 'group', group: override.group };
                }
                return resolveFileScope(__AUTOMETA_FEATURE_FILE);
              }

              function isVisibleStepScope(stepScope, featureScope) {
                if (featureScope.kind === 'root') {
                  return stepScope.kind === 'root';
                }
                if (featureScope.kind === 'group') {
                  if (stepScope.kind === 'root') return true;
                  return stepScope.kind === 'group' && stepScope.group === featureScope.group;
                }
                // module
                if (stepScope.kind === 'root') return true;
                if (stepScope.kind === 'group') return stepScope.group === featureScope.group;
                if (stepScope.kind === 'module') {
                  return stepScope.group === featureScope.group && startsWithSegments(featureScope.modulePath, stepScope.modulePath);
                }
                return false;
              }

              function stepScopeRank(scope) {
                if (scope.kind === 'module') return 200 + (scope.modulePath ? scope.modulePath.length : 0);
                if (scope.kind === 'group') return 100;
                return 0;
              }

              const useScopedSteps = __AUTOMETA_STEP_SCOPING_MODE === 'scoped' && __AUTOMETA_STEP_SCOPING && __AUTOMETA_STEP_SCOPING.groups;
              const featureScope = useScopedSteps ? resolveFeatureScope() : { kind: 'root' };
              const visibleSteps = useScopedSteps
                ? allSteps
                    .filter((definition) => {
                      const file = definition && definition.source ? definition.source.file : undefined;
                      const scope = file ? resolveFileScope(file) : { kind: 'root' };
                      return isVisibleStepScope(scope, featureScope);
                    })
                    .sort((a, b) => {
                      const aFile = a && a.source ? a.source.file : undefined;
                      const bFile = b && b.source ? b.source.file : undefined;
                      const aScope = aFile ? resolveFileScope(aFile) : { kind: 'root' };
                      const bScope = bFile ? resolveFileScope(bFile) : { kind: 'root' };
                      const delta = stepScopeRank(bScope) - stepScopeRank(aScope);
                      return delta !== 0 ? delta : String(a.id).localeCompare(String(b.id));
                    })
                : allSteps;

              const scopedStepsById = useScopedSteps
                ? (() => {
                    const allowed = new Set(visibleSteps.map((s) => s.id));
                    const next = new Map();
                    for (const [id, def] of basePlan.stepsById.entries()) {
                      if (allowed.has(id)) next.set(id, def);
                    }
                    return next;
                  })()
                : basePlan.stepsById;
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
                    steps: visibleSteps,
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
                        steps: visibleSteps,
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
                    steps: visibleSteps,
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
                steps: visibleSteps,
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
                stepsById: scopedStepsById,
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

            const gherkin = ${JSON.stringify(code)};
            const feature = parseGherkin(gherkin);
            const environments = collectStepsEnvironments(stepModules);
            const steps = selectStepsEnvironment(environments, feature);

            if (!steps) {
              throw new Error('Autometa could not find a steps environment for this feature. If you are using per-group environments, ensure each group exports a steps environment ("stepsEnvironment" or default export) under the configured step roots.');
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
          `,
          map: null,
        };
      }
    },
  };
}

interface StepGlobOptions {
  readonly configDir: string;
  readonly projectRoot: string;
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

async function loadAutometaConfig(root: string): Promise<{ config: Config; path: string }> {
  const _jiti = jiti(root, { interopDefault: true });

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
