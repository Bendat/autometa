import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";

import type { ExecutorConfig } from "@autometa/config";

export type RunnerType = "vitest" | "jest" | "default";

export interface OrchestratorOptions {
  readonly cwd: string;
  readonly config: ExecutorConfig;
  readonly patterns?: readonly string[];
  readonly dryRun?: boolean;
  readonly watch?: boolean;
  readonly verbose?: boolean;
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

  // Auto-detect based on config files in project
  if (existsSync(join(cwd, "vitest.config.ts")) || existsSync(join(cwd, "vitest.config.js"))) {
    return "vitest";
  }
  if (existsSync(join(cwd, "jest.config.js")) || existsSync(join(cwd, "jest.config.cjs")) || existsSync(join(cwd, "jest.config.ts"))) {
    return "jest";
  }

  // Fallback to default standalone runtime
  return "default";
}

/**
 * Smart Orchestrator that delegates to native test runners.
 * 
 * This is the "One Command to Rule Them All" - users run `autometa run`
 * and we intelligently delegate to Vitest, Jest, or our standalone runtime.
 */
export async function orchestrate(options: OrchestratorOptions): Promise<OrchestratorResult> {
  const { cwd, config, patterns = [], dryRun = false, watch = false, verbose = false } = options;
  const runner = detectRunner(config, cwd);

  if (verbose) {
    console.log(`[autometa] Detected runner: ${runner}`);
  }

  switch (runner) {
    case "vitest":
      return spawnVitest({ cwd, patterns, dryRun, watch, verbose });
    case "jest":
      return spawnJest({ cwd, patterns, dryRun, watch, verbose });
    case "default":
      // Return indicator that we should use the standalone runtime
      return { success: true, exitCode: 0, runner: "default" };
  }
}

interface SpawnRunnerOptions {
  readonly cwd: string;
  readonly patterns: readonly string[];
  readonly dryRun: boolean;
  readonly watch: boolean;
  readonly verbose: boolean;
}

/**
 * Spawns Vitest with the autometa plugin.
 */
async function spawnVitest(options: SpawnRunnerOptions): Promise<OrchestratorResult> {
  const { cwd, patterns, dryRun, watch, verbose } = options;

  const args: string[] = [];
  
  // Use run mode unless watch is requested
  if (!watch) {
    args.push("run");
  }

  // Add pattern filters if provided
  if (patterns.length > 0) {
    // Vitest accepts file patterns directly
    args.push(...patterns);
  }

  // Dry run mode (vitest doesn't have native dry-run, but we can use --passWithNoTests)
  if (dryRun) {
    args.push("--passWithNoTests");
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
  const { cwd, patterns, dryRun, watch, verbose } = options;

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

  if (verbose) {
    console.log(`[autometa] Running: jest ${args.join(" ")}`);
  }

  const result = await spawnRunner("jest", args, { cwd });
  return { ...result, runner: "jest" };
}

/**
 * Generic runner spawner with promise-based completion.
 */
function spawnRunner(
  command: string,
  args: string[],
  options: { cwd: string }
): Promise<{ success: boolean; exitCode: number }> {
  return new Promise((resolve) => {
    const spawnOptions: SpawnOptions = {
      cwd: options.cwd,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        // Ensure colors are preserved
        FORCE_COLOR: "1",
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
