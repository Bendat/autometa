import { resolve, isAbsolute, relative, dirname, extname } from "path";
import { existsSync } from "fs";
import type { Plugin } from "vite";
import type { Config } from "@autometa/config";
import jiti from "jiti";

const STEP_FALLBACK_GLOB = "**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}";

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

        return {
          code: `
            import { describe } from 'vitest';
            import { execute } from '@autometa/vitest-executor';
            import { coordinateRunnerFeature, CucumberRunner } from '@autometa/runner';
            import { parseGherkin } from '@autometa/gherkin';

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

            const gherkin = ${JSON.stringify(code)};
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
