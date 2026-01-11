import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

import fg from "fast-glob";
import pc from "picocolors";
import { Command } from "commander";

import type { ExistingCase } from "./matcher";
import type { DuplicatePolicy } from "./duplicate-policy";
import type { SuiteResolution } from "./suite-context";

import { parseFeature } from "./parser";
import { buildPlan, formatPlanVerboseWithSuite } from "./plan";
import { HttpTestRailClient } from "./client";
import { resolveSuiteContext } from "./suite-context";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version?: string };

export async function createCliProgram(): Promise<Command> {
  const program = new Command();
  program
    .name("testrail-cucumber")
    .description("Upload/plan Cucumber feature files to TestRail")
    .version(version ?? "0.0.0");

  registerPlanCommand(program);

  return program;
}

function registerPlanCommand(program: Command): void {
  program
    .command("plan")
    .argument("<patterns...>", "Feature file globs (e.g. 'features/**/*.feature')")
    .option("--existing-cases <path>", "JSON file containing ExistingCase[] used for matching")
    .option(
      "--duplicate-policy <policy>",
      "How to handle ambiguous matches: error|skip|create-new|prompt (default: prompt in TTY, else error)"
    )
    .option("--interactive", "Allow interactive prompts", true)
    .option("--no-interactive", "Disable interactive prompts")
    .option("--force-prompt", "When prompting, allow large candidate sets (unsafe)")
    .option("--max-prompt-candidates <n>", "Max candidates to show when prompting", (v) => Number(v), 10)
    // Suite/TestRail options (optional for planning)
    .option("--testrail-url <url>", "TestRail base URL (e.g. https://testrail.example.com)")
    .option("--testrail-username <username>", "TestRail username")
    .option("--testrail-password <password>", "TestRail password / API key")
    .option("--project-id <id>", "TestRail project ID", (v) => Number(v))
    .option("--suite-id <id>", "Suite ID (multi-suite projects)", (v) => Number(v))
    .option("--suite-name <name>", "Suite name (multi-suite projects; will create if allowed)")
    .option("--default-suite-name <name>", "Fallback suite name (multi-suite projects; will create if allowed)")
    .option(
      "--create-missing-suite",
      "Allow creating missing suites when resolving by name (default: false in plan command)",
      false
    )
    .action(async (patterns: string[], opts) => {
      const duplicatePolicy = normalizeDuplicatePolicy(opts.duplicatePolicy);
      const interactive = Boolean(opts.interactive);
      const maxPromptCandidates = Number(opts.maxPromptCandidates);
      const forcePrompt = Boolean(opts.forcePrompt);

      const existingCases = await loadExistingCases(opts.existingCases);

      const suite = await maybeResolveSuite(opts);

      if (suite?.messages?.length) {
        for (const line of suite.messages) {
          console.log(line);
        }
        console.log("");
      }

      const filePaths = await fg(patterns, { onlyFiles: true, unique: true, dot: false });
      if (filePaths.length === 0) {
        throw new Error(`No feature files matched: ${patterns.join(", ")}`);
      }

      for (const filePath of filePaths) {
        const text = await fs.readFile(filePath, "utf8");
        const featurePath = toRepoRelative(filePath);
        const feature = parseFeature(text, featurePath);

        const plan = await buildPlan({
          feature,
          existingCases,
          duplicatePolicy,
          interactive,
          forcePrompt,
          maxPromptCandidates,
        });

        const heading = pc.bold(`${featurePath}`);
        console.log(heading);
        for (const line of formatPlanVerboseWithSuite(plan, undefined)) {
          console.log("  " + line);
        }
        console.log("");
      }
    });
}

function normalizeDuplicatePolicy(value: unknown): DuplicatePolicy {
  if (value === undefined || value === null || value === "") {
    return process.stdout.isTTY ? "prompt" : "error";
  }
  switch (String(value)) {
    case "error":
    case "skip":
    case "create-new":
    case "prompt":
      return String(value) as DuplicatePolicy;
    default:
      throw new Error(`Invalid --duplicate-policy: ${String(value)}`);
  }
}

async function loadExistingCases(file?: string): Promise<ExistingCase[]> {
  if (!file) {
    return [];
  }
  const raw = await fs.readFile(file, "utf8");
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) {
    throw new Error(`--existing-cases must be a JSON array. Got: ${typeof data}`);
  }
  return data as ExistingCase[];
}

async function maybeResolveSuite(opts: any): Promise<SuiteResolution | undefined> {
  const url = opts.testrailUrl ?? process.env.TESTRAIL_URL;
  const username = opts.testrailUsername ?? process.env.TESTRAIL_USERNAME;
  const password = opts.testrailPassword ?? process.env.TESTRAIL_PASSWORD;
  const projectId = opts.projectId ?? (process.env.TESTRAIL_PROJECT_ID ? Number(process.env.TESTRAIL_PROJECT_ID) : undefined);

  if (!url || !username || !password || projectId === undefined || Number.isNaN(projectId)) {
    return undefined;
  }

  const client = new HttpTestRailClient({ url, username, password });

  return resolveSuiteContext(client, projectId, {
    ...(opts.suiteId !== undefined ? { suiteId: opts.suiteId as number } : {}),
    ...(opts.suiteName !== undefined ? { suiteName: opts.suiteName as string } : {}),
    ...(opts.defaultSuiteName !== undefined ? { defaultSuiteName: opts.defaultSuiteName as string } : {}),
    createMissingSuite: Boolean(opts.createMissingSuite),
    // For the plan command, default to non-strict warnings.
    strict: false,
  });
}

function toRepoRelative(filePath: string): string {
  const rel = path.relative(process.cwd(), filePath);
  // Use forward slashes for stable signatures across OSes.
  return rel.split(path.sep).join("/");
}
