import { spawn, type SpawnOptions } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";

import type { ExecutorConfig } from "@autometa/config";
import { expandFilePatterns } from "../utils/glob";

export type RunnerType = "vitest" | "jest" | "playwright" | "default";

export interface OrchestratorOptions {
  readonly cwd: string;
  readonly config: ExecutorConfig;
  readonly patterns?: readonly string[];
  /**
   * Extra args to pass directly to the detected native runner.
   * Intended for runner-specific flags like Jest `-t` or Vitest `--testNamePattern`.
   */
  readonly runnerArgs?: readonly string[];
  readonly dryRun?: boolean;
  readonly watch?: boolean;
  readonly verbose?: boolean;
  readonly groups: readonly string[] | undefined;
  readonly modules: readonly string[] | undefined;
}

export interface OrchestratorResult {
  readonly success: boolean;
  readonly exitCode: number;
  readonly runner: RunnerType;
}

/**
 * Detects the appropriate runner based on config and project structure.
 */
export function detectRunner(config: ExecutorConfig, cwd: string): RunnerType {
  // Explicit runner from config takes priority
  if (config.runner === "vitest") {
    return "vitest";
  }
  if (config.runner === "jest") {
    return "jest";
  }
  if (config.runner === "playwright") {
    return "playwright";
  }

  // Auto-detect based on config files in project
  if (existsSync(join(cwd, "vitest.config.ts")) || existsSync(join(cwd, "vitest.config.js"))) {
    return "vitest";
  }
  if (existsSync(join(cwd, "jest.config.js")) || existsSync(join(cwd, "jest.config.cjs")) || existsSync(join(cwd, "jest.config.ts"))) {
    return "jest";
  }
  if (existsSync(join(cwd, "playwright.config.ts")) || existsSync(join(cwd, "playwright.config.js"))) {
    return "playwright";
  }

  // Fallback to default standalone runtime
  return "default";
}

interface FilterPatternsOptions {
  readonly patterns: readonly string[];
  readonly groups: readonly string[] | undefined;
  readonly modules: readonly string[] | undefined;
  readonly config: ExecutorConfig;
  readonly cwd: string;
  readonly verbose: boolean;
}

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

/**
 * Filters feature patterns based on group and module selection.
 * This ensures that -g and -m flags work with native runners (vitest/jest).
 */
function filterPatternsByGroupsAndModules(options: FilterPatternsOptions): readonly string[] {
  const { patterns, groups, modules, config, verbose } = options;

  const hasGroupSelection = (groups?.length ?? 0) > 0;
  const hasModuleSelection = (modules?.length ?? 0) > 0;
  const hasAnySelection = hasGroupSelection || hasModuleSelection;
  const hasExplicitPatterns = patterns.length > 0;

  // If explicit patterns are provided, use them (with optional warning)
  if (hasExplicitPatterns) {
    if (hasAnySelection && verbose) {
      const shouldWarn = (() => {
        const configGroups = config.modules?.groups;
        if (!configGroups) {
          return true;
        }

        // If groups were explicitly selected, only warn if patterns extend beyond group roots
        if (hasGroupSelection) {
          const allowedGroups = new Set(groups);
          const allowedRoots = Object.entries(configGroups)
            .filter(([group]) => allowedGroups.has(group))
            .map(([, groupConfig]) => groupConfig.root);

          if (allowedRoots.length > 0) {
            return patterns.some((pattern) =>
              !allowedRoots.some((root) => patternIsUnderRoot(pattern, root))
            );
          }
        }

        return true;
      })();

      if (shouldWarn) {
        console.warn(
          "[autometa] Note: when you pass explicit feature patterns, they are used as-is. " +
            "Group/module filters (-g/-m) affect module/step loading, but do not automatically filter your feature patterns."
        );
      }
    }
    return patterns;
  }

  // No explicit patterns - derive from config roots
  const roots = [...config.roots.features];

  // If group/module selection is active, filter to only those group/module paths
  if (hasAnySelection && config.modules?.groups) {
    const allowedGroups = hasGroupSelection
      ? new Set(groups)
      : new Set(Object.keys(config.modules.groups));

    // Build module-specific patterns if modules are specified
    if (hasModuleSelection && modules && modules.length > 0) {
      const modulePatterns: string[] = [];
      const relativeRoots = config.modules.relativeRoots?.features ?? ['.features/**/*.feature'];

      for (const [groupName, groupConfig] of Object.entries(config.modules.groups)) {
        if (!allowedGroups.has(groupName)) {
          continue;
        }

        const groupRoot = groupConfig.root;
        const groupModules = groupConfig.modules ?? [];

        for (const moduleName of modules) {
          // Check if this module exists in this group
          const moduleExists = Array.isArray(groupModules) && groupModules.some((m) => {
            if (typeof m === 'string') {
              return m === moduleName || m.endsWith(`/${moduleName}`) || m.endsWith(`:${moduleName}`);
            }
            return false;
          });

          if (moduleExists) {
            // Build module-specific pattern: <groupRoot>/<moduleName>/<relativeRoot>
            for (const relativeRoot of relativeRoots) {
              const normalizedRelative = relativeRoot.replace(/^\.\//, '');
              const modulePath = join(groupRoot, moduleName, normalizedRelative);
              modulePatterns.push(modulePath);
            }
          }
        }
      }

      if (modulePatterns.length > 0) {
        return modulePatterns;
      }
    }

    // No module-specific filtering - just filter by group roots
    const allowedRoots = Object.entries(config.modules.groups)
      .filter(([group]) => allowedGroups.has(group))
      .map(([, groupConfig]) => groupConfig.root);

    const filtered = roots.filter((pattern) =>
      allowedRoots.some((root) => patternIsUnderRoot(pattern, root))
    );

    // If filtering worked, use filtered patterns
    if (filtered.length > 0) {
      return filtered;
    }
  }

  return roots;
}

/**
 * Smart Orchestrator that delegates to native test runners.
 *
 * This is the "One Command to Rule Them All" - users run `autometa run`
 * and we intelligently delegate to Vitest, Jest, or our standalone runtime.
 */
export async function orchestrate(options: OrchestratorOptions): Promise<OrchestratorResult> {
  const { cwd, config, patterns = [], runnerArgs = [], dryRun = false, watch = false, verbose = false, groups, modules } = options;
  const runner = detectRunner(config, cwd);

  if (verbose) {
    console.log(`[autometa] Detected runner: ${runner}`);
  }

  // Apply group/module filtering to patterns
  const filteredPatterns = filterPatternsByGroupsAndModules({
    patterns,
    groups,
    modules,
    config,
    cwd,
    verbose,
  });

  switch (runner) {
    case "vitest":
      return spawnVitest({ cwd, patterns: filteredPatterns, runnerArgs, dryRun, watch, verbose });
    case "jest":
      return spawnJest({ cwd, patterns: filteredPatterns, runnerArgs, dryRun, watch, verbose });
    case "playwright":
      return spawnPlaywright({ cwd, patterns: filteredPatterns, runnerArgs, dryRun, watch, verbose });
    case "default":
      // Return indicator that we should use the standalone runtime
      return { success: true, exitCode: 0, runner: "default" };
  }
}

interface SpawnRunnerOptions {
  readonly cwd: string;
  readonly patterns: readonly string[];
  readonly runnerArgs: readonly string[];
  readonly dryRun: boolean;
  readonly watch: boolean;
  readonly verbose: boolean;
}

/**
 * Spawns Vitest with the autometa plugin.
 */
async function spawnVitest(options: SpawnRunnerOptions): Promise<OrchestratorResult> {
  const { cwd, patterns, runnerArgs, dryRun, watch, verbose } = options;

  const args: string[] = [];
  
  // Use run mode unless watch is requested
  if (!watch) {
    args.push("run");
  }

  // Add pattern filters if provided
  if (patterns.length > 0) {
    // Vitest CLI filters are regex-like; glob patterns (e.g. **/*.feature) won't match.
    // Expand globs to concrete file paths so -g/-m selection works reliably.
    const expanded = await expandFilePatterns(patterns, cwd);
    args.push(...(expanded.length > 0 ? expanded : patterns));
  }

  // Dry run mode (vitest doesn't have native dry-run, but we can use --passWithNoTests)
  if (dryRun) {
    args.push("--passWithNoTests");
  }

  if (runnerArgs.length > 0) {
    args.push(...runnerArgs);
  }

  if (verbose) {
    console.log(`[autometa] Running: vitest ${args.join(" ")}`);
  }

  const result = await spawnRunner("vitest", args, { cwd });
  return { ...result, runner: "vitest" };
}

/**
 * Spawns Jest with the autometa transformer.
 */
async function spawnJest(options: SpawnRunnerOptions): Promise<OrchestratorResult> {
  const { cwd, patterns, runnerArgs, dryRun, watch, verbose } = options;

  const args: string[] = [];

  // Watch mode
  if (watch) {
    args.push("--watch");
  }

  // Add pattern filters if provided
  if (patterns.length > 0) {
    args.push(...patterns);
  }

  // Dry run mode - Jest uses --listTests
  if (dryRun) {
    args.push("--listTests");
  }

  if (runnerArgs.length > 0) {
    args.push(...runnerArgs);
  }

  if (verbose) {
    console.log(`[autometa] Running: jest ${args.join(" ")}`);
  }

  const result = await spawnRunner("jest", args, { cwd });
  return { ...result, runner: "jest" };
}

/**
 * Spawns Playwright with the autometa loader.
 * 
 * Playwright requires Node.js module hooks to transform .feature files.
 * We use `npx playwright test` with appropriate flags.
 */
async function spawnPlaywright(options: SpawnRunnerOptions): Promise<OrchestratorResult> {
  const { cwd, patterns, runnerArgs, dryRun, watch, verbose } = options;

  const args: string[] = ["test"];

  // Add pattern filters if provided (Playwright uses grep or file patterns)
  if (patterns.length > 0) {
    // Playwright accepts file patterns directly after 'test'
    args.push(...patterns);
  }

  // Dry run mode - Playwright uses --list to list tests
  if (dryRun) {
    args.push("--list");
  }

  // Watch mode - Playwright uses --ui for interactive mode
  // Note: --ui opens a browser UI, which may not be ideal for all use cases
  // For headless watch-like behavior, we'd need a different approach
  if (watch) {
    args.push("--ui");
  }

  if (runnerArgs.length > 0) {
    args.push(...runnerArgs);
  }

  if (verbose) {
    console.log(`[autometa] Running: playwright ${args.join(" ")}`);
  }

  const loaderImportFlag = "--import @autometa/playwright-loader/register";
  const existingNodeOptions = process.env.NODE_OPTIONS ?? "";
  const hasLoaderFlag = existingNodeOptions.includes(loaderImportFlag);
  const nodeOptions = hasLoaderFlag
    ? existingNodeOptions
    : [existingNodeOptions, loaderImportFlag].filter(Boolean).join(" ").trim();

  const result = await spawnRunner("playwright", args, {
    cwd,
    env: {
      NODE_OPTIONS: nodeOptions,
    },
  });
  return { ...result, runner: "playwright" };
}

/**
 * Generic runner spawner with promise-based completion.
 */
function spawnRunner(
  command: string,
  args: string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv }
): Promise<{ success: boolean; exitCode: number }> {
  return new Promise((resolve) => {
    const spawnOptions: SpawnOptions = {
      cwd: options.cwd,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: process.env.FORCE_COLOR ?? "1",
        ...(options.env ?? {}),
      },
    };

    // Try to find the command in node_modules/.bin first
    const binPath = join(options.cwd, "node_modules", ".bin", command);
    const actualCommand = existsSync(binPath) ? binPath : command;

    const child = spawn(actualCommand, args, spawnOptions);

    child.on("close", (code) => {
      const exitCode = code ?? 0;
      resolve({
        success: exitCode === 0,
        exitCode,
      });
    });

    child.on("error", (error) => {
      console.error(`[autometa] Failed to spawn ${command}:`, error.message);
      resolve({
        success: false,
        exitCode: 1,
      });
    });
  });
}

/**
 * Checks if a native runner is available for the project.
 */
export function isNativeRunnerAvailable(runner: RunnerType, cwd: string): boolean {
  if (runner === "default") {
    return true;
  }

  const binPath = join(cwd, "node_modules", ".bin", runner);
  return existsSync(binPath);
}
