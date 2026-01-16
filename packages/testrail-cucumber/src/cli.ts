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
import { syncFeatureToTestRail } from "./sync";
import { applyCaseTagsToFeatureText } from "./tag-writeback";
import { formatFeatureFile } from "./formatter";
import {
  loadStoredCredentials,
  saveCredentials,
  clearCredentials,
  getCredentialsFilePath,
  type StoredCredentials,
} from "./credentials";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version?: string };

async function runInteractiveMode(): Promise<void> {
  const enquirer = await import("enquirer");
  const prompt = enquirer.default?.prompt ?? enquirer.prompt;
  const stored = await loadStoredCredentials();

  // Check if we have basic credentials
  if (!stored?.url || !stored?.username || !stored?.password) {
    console.log(pc.yellow("Welcome to testrail-cucumber!"));
    console.log(pc.dim("No stored credentials found. Let's get you set up.\n"));

    const response = await prompt<{ action: string }>({
      type: "select",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: "login", message: "Login (store credentials)" },
        { name: "sync", message: "Sync features (one-time, provide credentials)" },
        { name: "plan", message: "Plan features (one-time, provide credentials)" },
        { name: "exit", message: "Exit" },
      ],
    });

    if (response.action === "exit") {
      return;
    }

    if (response.action === "login") {
      await runInteractiveLogin();
      return;
    }

    if (response.action === "sync") {
      await runInteractiveSync();
      return;
    }

    if (response.action === "plan") {
      await runInteractivePlan();
      return;
    }

    return;
  }

  // We have credentials, show main menu
  const statusLines: string[] = [];
  statusLines.push(pc.green("✓") + " Logged in as " + pc.bold(stored.username));
  statusLines.push(pc.green("✓") + " URL: " + pc.dim(stored.url));
  if (stored.projectId !== undefined) {
    statusLines.push(pc.green("✓") + " Default project: " + pc.bold(String(stored.projectId)));
  } else {
    statusLines.push(pc.yellow("⚠") + " No default project set");
  }

  console.log(statusLines.join("\n") + "\n");

  const response = await prompt<{ action: string }>({
    type: "select",
    name: "action",
    message: "What would you like to do?",
    choices: [
      { name: "sync", message: "Sync features to TestRail" },
      { name: "plan", message: "Plan features (dry-run)" },
      { name: "set-project", message: "Set default project ID" },
      { name: "set-url", message: "Change TestRail URL" },
      { name: "logout", message: "Logout (remove credentials)" },
      { name: "exit", message: "Exit" },
    ],
  });

  if (response.action === "exit") {
    return;
  }

  if (response.action === "sync") {
    await runInteractiveSync();
    return;
  }

  if (response.action === "plan") {
    await runInteractivePlan();
    return;
  }

  if (response.action === "set-project") {
    await runInteractiveSetProject();
    return;
  }

  if (response.action === "set-url") {
    await runInteractiveSetUrl();
    return;
  }

  if (response.action === "logout") {
    const removed = await clearCredentials();
    if (removed) {
      console.log(pc.green("Credentials removed"));
    }
    return;
  }
}

async function runInteractiveLogin(): Promise<void> {
  const enquirer = await import("enquirer");
  const prompt = enquirer.default?.prompt ?? enquirer.prompt;

  const responses = await prompt<{
    url: string;
    username: string;
    password: string;
    projectId: string;
  }>([
    {
      type: "input",
      name: "url",
      message: "TestRail URL:",
      initial: process.env.TESTRAIL_URL,
    },
    {
      type: "input",
      name: "username",
      message: "TestRail username:",
      initial: process.env.TESTRAIL_USERNAME,
    },
    {
      type: "password",
      name: "password",
      message: "TestRail password / API key:",
    },
    {
      type: "input",
      name: "projectId",
      message: "Default project ID (optional, press Enter to skip):",
      initial: process.env.TESTRAIL_PROJECT_ID,
    },
  ]);

  let projectId: number | undefined;
  if (responses.projectId.trim()) {
    projectId = Number(responses.projectId);
    if (Number.isNaN(projectId)) {
      console.error(pc.red("Invalid project ID. Must be a number."));
      process.exitCode = 1;
      return;
    }
  }

  const credentials: StoredCredentials = {
    url: responses.url.trim(),
    username: responses.username.trim(),
    password: responses.password,
    ...(projectId !== undefined ? { projectId } : {}),
  };

  await saveCredentials(credentials);
  console.log(pc.green("\nCredentials saved!"));
  console.log(pc.dim("Run 'testrail-cucumber' again to sync or plan features."));
}

async function runInteractiveSetProject(): Promise<void> {
  const enquirer = await import("enquirer");
  const prompt = enquirer.default?.prompt ?? enquirer.prompt;
  const existing = await loadStoredCredentials();

  if (!existing) {
    console.error(pc.red("No stored credentials found. Run 'login' first."));
    process.exitCode = 1;
    return;
  }

  const response = await prompt<{ projectId: string }>({
    type: "input",
    name: "projectId",
    message: "Default project ID:",
    initial: existing.projectId?.toString(),
  });

  const projectId = Number(response.projectId);
  if (Number.isNaN(projectId)) {
    console.error(pc.red("Invalid project ID. Must be a number."));
    process.exitCode = 1;
    return;
  }

  await saveCredentials({ ...existing, projectId });
  console.log(pc.green("Default project ID updated:"), projectId);
}

async function runInteractiveSetUrl(): Promise<void> {
  const enquirer = await import("enquirer");
  const prompt = enquirer.default?.prompt ?? enquirer.prompt;
  const existing = await loadStoredCredentials();

  if (!existing) {
    console.error(pc.red("No stored credentials found. Run 'login' first."));
    process.exitCode = 1;
    return;
  }

  const response = await prompt<{ url: string }>({
    type: "input",
    name: "url",
    message: "TestRail URL:",
    initial: existing.url,
  });

  await saveCredentials({ ...existing, url: response.url.trim() });
  console.log(pc.green("URL updated:"), response.url.trim());
}

async function runInteractiveSync(): Promise<void> {
  const enquirer = await import("enquirer");
  const prompt = enquirer.default?.prompt ?? enquirer.prompt;
  const stored = await loadStoredCredentials();

  // Gather credentials if not stored
  let url = stored?.url;
  let username = stored?.username;
  let password = stored?.password;
  let projectId = stored?.projectId;

  if (!url || !username || !password) {
    console.log(pc.yellow("\nCredentials needed for this sync:\n"));

    const credResponses = await prompt<{
      url?: string;
      username?: string;
      password?: string;
    }>([
      ...(!url
        ? [
            {
              type: "input" as const,
              name: "url" as const,
              message: "TestRail URL:",
              initial: process.env.TESTRAIL_URL,
            },
          ]
        : []),
      ...(!username
        ? [
            {
              type: "input" as const,
              name: "username" as const,
              message: "TestRail username:",
              initial: process.env.TESTRAIL_USERNAME,
            },
          ]
        : []),
      ...(!password
        ? [
            {
              type: "password" as const,
              name: "password" as const,
              message: "TestRail password / API key:",
            },
          ]
        : []),
    ]);

    url = url ?? credResponses.url;
    username = username ?? credResponses.username;
    password = password ?? credResponses.password;
  }

  if (!projectId) {
    const projectResponse = await prompt<{ projectId: string }>({
      type: "input",
      name: "projectId",
      message: "Project ID:",
      initial: process.env.TESTRAIL_PROJECT_ID,
    });
    projectId = Number(projectResponse.projectId);
    if (Number.isNaN(projectId)) {
      console.error(pc.red("Invalid project ID. Must be a number."));
      process.exitCode = 1;
      return;
    }
  }

  // Gather feature files
  const fileResponse = await prompt<{ patterns: string }>({
    type: "input",
    name: "patterns",
    message: "Feature file pattern(s) (space-separated):",
    initial: "features/**/*.feature",
  });

  const patterns = fileResponse.patterns.split(/\s+/).filter(Boolean);

  // Additional options
  const optionsResponse = await prompt<{
    updateExisting: boolean;
    writeTags: boolean;
    dryRun: boolean;
  }>([
    {
      type: "confirm",
      name: "dryRun",
      message: "Dry run (preview changes without modifying TestRail)?",
      initial: true,
    },
    {
      type: "confirm",
      name: "updateExisting",
      message: "Update existing test cases?",
      initial: false,
    },
    {
      type: "confirm",
      name: "writeTags",
      message: "Write @testrail-case-<id> tags back to feature files?",
      initial: false,
    },
  ]);

  // Build the client
  if (!url || !username || !password) {
    console.error(pc.red("Missing required credentials"));
    process.exitCode = 1;
    return;
  }

  const client = new HttpTestRailClient({ url, username, password });

  // Resolve outline/example handling from stored settings
  const outlineIs = resolveOutlineIs(undefined, stored?.outlineIs);
  const exampleIs = resolveExampleIs(undefined, stored?.exampleIs);

  // Try to resolve suite context - if multi-suite project, we'll handle per-feature
  let baseSuite: SuiteResolution | undefined;
  let isMultiSuiteProject = false;
  try {
    baseSuite = await resolveSuiteContext(client, projectId, {
      createMissingSuite: !optionsResponse.dryRun,
      strict: false,
    });
  } catch (error) {
    // Check if error is about needing a suite (multi-suite project)
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("multi-suite") || message.includes("suite-id") || message.includes("suite-name")) {
      isMultiSuiteProject = true;
      console.log(pc.yellow("\nThis is a multi-suite project. Each feature will create/use its own suite based on the feature name.\n"));
    } else {
      throw error;
    }
  }

  if (baseSuite?.messages.length) {
    for (const line of baseSuite.messages) {
      console.log(line);
    }
    console.log("");
  }

  const filePaths = await resolveFeatureFiles(patterns);
  if (filePaths.length === 0) {
    throw new Error(`No feature files matched: ${patterns.join(", ")}`);
  }

  for (const filePath of filePaths) {
    const text = await fs.readFile(filePath, "utf8");
    const featurePath = toRepoRelative(filePath);
    const feature = parseFeature(text, featurePath);

    // For multi-suite projects, resolve suite per-feature using the feature name
    let suite: SuiteResolution;
    if (isMultiSuiteProject) {
      const featureName = feature.name || path.basename(featurePath, ".feature");
      suite = await resolveSuiteContext(client, projectId, {
        suiteName: featureName,
        createMissingSuite: !optionsResponse.dryRun,
        strict: false,
      });
      if (suite.messages.length) {
        for (const line of suite.messages) {
          console.log("  " + line);
        }
      }
    } else if (baseSuite !== undefined) {
      suite = baseSuite;
    } else {
      throw new Error("Expected baseSuite to be defined for single-suite project");
    }

    const result = await syncFeatureToTestRail(client, suite, feature, projectId, {
      duplicatePolicy: "prompt",
      interactive: true,
      forcePrompt: false,
      maxPromptCandidates: 10,
      dryRun: optionsResponse.dryRun,
      updateExisting: optionsResponse.updateExisting,
      outlineIs,
      exampleIs,
    });

    console.log(pc.bold(`${featurePath}`));
    for (const line of result.messages) {
      console.log("  " + line);
    }

    if (!optionsResponse.dryRun && optionsResponse.writeTags) {
      const caseTagPrefix = stored?.caseTagPrefix ?? "@testrail-case-";
      const suiteTagPrefix = stored?.suiteTagPrefix ?? "@testrail-suite-";
      const sectionTagPrefix = stored?.sectionTagPrefix ?? "@testrail-section-";
      const suiteTag = suite.context.mode === "multi" ? `${suiteTagPrefix}${suite.context.suiteId}` : undefined;
      const featureSectionTag = result.sectionId !== -1 ? `${sectionTagPrefix}${result.sectionId}` : undefined;
      const writeback = applyCaseTagsToFeatureText(text, feature, result.caseIdBySignature, {
        caseTagPrefix,
        sectionTagPrefix,
        ...(suiteTag ? { suiteTag } : {}),
        ...(featureSectionTag ? { featureSectionTag } : {}),
        ruleSectionIdsByName: result.ruleSectionIdsByName,
        ...(stored?.outlineIs !== undefined ? { outlineIs: stored.outlineIs } : {}),
        ...(stored?.exampleIs !== undefined ? { exampleIs: stored.exampleIs } : {}),
        ...(stored?.exampleCaseTagPlacement !== undefined ? { exampleCaseTagPlacement: stored.exampleCaseTagPlacement } : {}),
        ...(result.outlineSectionIdsBySignature !== undefined ? { outlineSectionIdsBySignature: result.outlineSectionIdsBySignature } : {}),
        ...(result.exampleSectionIdsByKey !== undefined ? { exampleSectionIdsByKey: result.exampleSectionIdsByKey } : {}),
      });
      if (writeback.changed) {
        const formattedText = formatFeatureFile(writeback.updatedText);
        await fs.writeFile(filePath, formattedText, "utf8");
        console.log("  " + pc.green(`Wrote tags to ${featurePath}`));
      }
    }
    console.log("");
  }
}

async function runInteractivePlan(): Promise<void> {
  const enquirer = await import("enquirer");
  const prompt = enquirer.default?.prompt ?? enquirer.prompt;
  const stored = await loadStoredCredentials();

  const fileResponse = await prompt<{ patterns: string }>({
    type: "input",
    name: "patterns",
    message: "Feature file pattern(s) (space-separated):",
    initial: "features/**/*.feature",
  });

  const patterns = fileResponse.patterns.split(/\s+/).filter(Boolean);

  const filePaths = await resolveFeatureFiles(patterns);
  if (filePaths.length === 0) {
    throw new Error(`No feature files matched: ${patterns.join(", ")}`);
  }

  // Check if we can connect to TestRail for suite context
  let suite: SuiteResolution | undefined;
  if (stored?.url && stored?.username && stored?.password && stored?.projectId) {
    const useSuiteResponse = await prompt<{ useTestRail: boolean }>({
      type: "confirm",
      name: "useTestRail",
      message: "Connect to TestRail to show suite context?",
      initial: true,
    });

    if (useSuiteResponse.useTestRail) {
      const client = new HttpTestRailClient({
        url: stored.url,
        username: stored.username,
        password: stored.password,
      });

      suite = await resolveSuiteContext(client, stored.projectId, {
        createMissingSuite: false,
        strict: false,
      });

      if (suite.messages.length) {
        for (const line of suite.messages) {
          console.log(line);
        }
        console.log("");
      }
    }
  }

  for (const filePath of filePaths) {
    const text = await fs.readFile(filePath, "utf8");
    const featurePath = toRepoRelative(filePath);
    const feature = parseFeature(text, featurePath);

    const plan = await buildPlan({
      feature,
      existingCases: [],
      duplicatePolicy: "prompt",
      interactive: true,
      forcePrompt: false,
      maxPromptCandidates: 10,
    });

    console.log(pc.bold(`${featurePath}`));
    for (const line of formatPlanVerboseWithSuite(plan, suite)) {
      console.log("  " + line);
    }
    console.log("");
  }
}

interface TestRailCliOptions {
  readonly testrailUrl?: string;
  readonly testrailUsername?: string;
  readonly testrailPassword?: string;
  readonly projectId?: number;
  readonly suiteId?: number;
  readonly suiteName?: string;
  readonly defaultSuiteName?: string;
  readonly createMissingSuite?: boolean;
}

export async function createCliProgram(): Promise<Command> {
  const program = new Command();
  program
    .name("testrail-cucumber")
    .description("Upload/plan Cucumber feature files to TestRail")
    .version(version ?? "0.0.0");

  registerLoginCommand(program);
  registerLogoutCommand(program);
  registerSetUrlCommand(program);
  registerSetProjectCommand(program);
  registerSetCaseTagPrefixCommand(program);
  registerSetSuiteTagPrefixCommand(program);
  registerSetSectionTagPrefixCommand(program);
  registerSetOutlineIsCommand(program);
  registerSetExampleIsCommand(program);
  registerSetExampleCaseTagPlacementCommand(program);
  registerPlanCommand(program);
  registerSyncCommand(program);

  // Default action: interactive mode
  program.action(async () => {
    await runInteractiveMode();
  });

  return program;
}

function registerSyncCommand(program: Command): void {
  program
    .command("sync")
    .argument("<patterns...>", "Feature file globs (e.g. 'features/**/*.feature')")
    .option(
      "--duplicate-policy <policy>",
      "How to handle ambiguous matches: error|skip|create-new|prompt (default: prompt in TTY, else error)"
    )
    .option("--interactive", "Allow interactive prompts", true)
    .option("--no-interactive", "Disable interactive prompts")
    .option("--force-prompt", "When prompting, allow large candidate sets (unsafe)")
    .option("--max-prompt-candidates <n>", "Max candidates to show when prompting", (v) => Number(v), 10)
    .option("--dry-run", "Do not mutate TestRail; print plan only", false)
    .option("--update-existing", "Update existing cases (title/description/steps)", false)
    .option("--write-tags", "Write @C<id> (and suite tag, if applicable) back into feature files", false)
    .option("--write-tags-on-dry-run", "When --dry-run, still write tags back into feature files", false)
    .option("--case-tag-prefix <prefix>", "Case id tag prefix (default: @testrail-case-)")
    .option("--suite-tag-prefix <prefix>", "Suite id tag prefix (default: @testrail-suite-)")
    .option("--section-tag-prefix <prefix>", "Section id tag prefix (default: @testrail-section-)")
    .option(
      "--migrate-to-rules",
      "When reusing an existing case that is not in the expected rule section, create a new copy in the rule section and tag the feature with the new id",
      false
    )
    .option("--steps-field <field>", "Steps field name (default: custom_steps_separated)")
    .option("--description-field <field>", "Description field name (default: custom_test_case_description)")
    .option(
      "--outline-is <mode>",
      'How to treat scenario outlines: "case" (one case per outline) or "section" (outline becomes a section)'
    )
    .option(
      "--example-is <mode>",
      'When outline-is=section, how to treat Examples: "case" (rows as cases) or "section" (Examples as subsections)'
    )
    .option(
      "--example-case-tag-placement <placement>",
      'Where to place case tags for example rows: "above" (default) or "inline" (in table column)'
    )
    // TestRail credentials
    .option("--testrail-url <url>", "TestRail base URL (e.g. https://testrail.example.com)")
    .option("--testrail-username <username>", "TestRail username")
    .option("--testrail-password <password>", "TestRail password / API key")
    .option("--project-id <id>", "TestRail project ID", (v) => Number(v))
    .option("--suite-id <id>", "Suite ID (multi-suite projects)", (v) => Number(v))
    .option("--suite-name <name>", "Suite name (multi-suite projects; may create)")
    .option("--default-suite-name <name>", "Fallback suite name (multi-suite projects; may create)")
    .action(async (patterns: string[], opts) => {
      const duplicatePolicy = normalizeDuplicatePolicy(opts.duplicatePolicy);
      const interactive = Boolean(opts.interactive);
      const maxPromptCandidates = Number(opts.maxPromptCandidates);
      const forcePrompt = Boolean(opts.forcePrompt);
      const dryRun = Boolean(opts.dryRun);
      const writeTagsOnDryRun = Boolean(opts.writeTagsOnDryRun);

      // Load stored credentials to get tag prefix preferences
      const stored = await loadStoredCredentials();
      const caseTagPrefix = String(opts.caseTagPrefix ?? stored?.caseTagPrefix ?? "@testrail-case-");
      const suiteTagPrefix = String(opts.suiteTagPrefix ?? stored?.suiteTagPrefix ?? "@testrail-suite-");
      const sectionTagPrefix = String(opts.sectionTagPrefix ?? stored?.sectionTagPrefix ?? "@testrail-section-");

      // Resolve outlineIs and exampleIs with priority: CLI flag > stored > default ("case")
      const outlineIs = resolveOutlineIs(opts.outlineIs, stored?.outlineIs);
      const exampleIs = resolveExampleIs(opts.exampleIs, stored?.exampleIs);
      const exampleCaseTagPlacement = resolveExampleCaseTagPlacement(opts.exampleCaseTagPlacement, stored?.exampleCaseTagPlacement);

      const { client, projectId } = await requireClientAsync(opts);

      const suite = await resolveSuiteContext(client, projectId, {
        ...(opts.suiteId !== undefined ? { suiteId: opts.suiteId } : {}),
        ...(opts.suiteName !== undefined ? { suiteName: opts.suiteName } : {}),
        ...(opts.defaultSuiteName !== undefined ? { defaultSuiteName: opts.defaultSuiteName } : {}),
        createMissingSuite: !dryRun,
        strict: false,
      });

      if (suite.messages.length) {
        for (const line of suite.messages) {
          console.log(line);
        }
        console.log("");
      }

      const filePaths = await resolveFeatureFiles(patterns);
      if (filePaths.length === 0) {
        throw new Error(`No feature files matched: ${patterns.join(", ")}`);
      }

      for (const filePath of filePaths) {
        const text = await fs.readFile(filePath, "utf8");
        const featurePath = toRepoRelative(filePath);
        const feature = parseFeature(text, featurePath);

        if (dryRun) {
          const result = await syncFeatureToTestRail(client, suite, feature, projectId, {
            duplicatePolicy,
            interactive,
            forcePrompt,
            maxPromptCandidates,
            dryRun: true,
            updateExisting: Boolean(opts.updateExisting),
            outlineIs,
            exampleIs,
            ...(opts.stepsField ? { stepsField: String(opts.stepsField) } : {}),
            ...(opts.descriptionField ? { descriptionField: String(opts.descriptionField) } : {}),
          });

          console.log(pc.bold(`${featurePath}`));
          for (const line of result.messages) {
            console.log("  " + line);
          }
          for (const line of formatPlanVerboseWithSuite(result.plan, undefined)) {
            console.log("  " + line);
          }

          if (opts.writeTags) {
            const suiteTag =
              suite.context.mode === "multi" ? `${suiteTagPrefix}${suite.context.suiteId}` : undefined;
            const featureSectionTag = result.sectionId !== -1 ? `${sectionTagPrefix}${result.sectionId}` : undefined;
            const writeback = applyCaseTagsToFeatureText(text, feature, result.caseIdBySignature, {
              caseTagPrefix,
              sectionTagPrefix,
              ...(suiteTag ? { suiteTag } : {}),
              ...(featureSectionTag ? { featureSectionTag } : {}),
              ruleSectionIdsByName: result.ruleSectionIdsByName,
              outlineIs,
              exampleIs,
              exampleCaseTagPlacement,
              ...(result.outlineSectionIdsBySignature !== undefined ? { outlineSectionIdsBySignature: result.outlineSectionIdsBySignature } : {}),
              ...(result.exampleSectionIdsByKey !== undefined ? { exampleSectionIdsByKey: result.exampleSectionIdsByKey } : {}),
            });
            if (writeback.applied.length) {
              console.log(
                "  " +
                  pc.dim(
                    writeTagsOnDryRun
                      ? "(dry-run) Writing tags back into files:"
                      : "(dry-run) Would update tags:"
                  )
              );
              for (const a of writeback.applied) {
                console.log("  " + pc.dim(`- ${a.nodeName}: +${a.addedTags.join(" ")}`));
              }
            }

            if (writeTagsOnDryRun && writeback.changed) {
              const formattedText = formatFeatureFile(writeback.updatedText);
              await fs.writeFile(filePath, formattedText, "utf8");
              console.log("  " + pc.green(`Wrote tags to ${featurePath}`));
            }
          }
          console.log("");
          continue;
        }

        const result = await syncFeatureToTestRail(client, suite, feature, projectId, {
          duplicatePolicy,
          interactive,
          forcePrompt,
          maxPromptCandidates,
          dryRun,
          updateExisting: Boolean(opts.updateExisting),
          migrateToRuleSections: Boolean(opts.migrateToRules),
          outlineIs,
          exampleIs,
          ...(opts.stepsField ? { stepsField: String(opts.stepsField) } : {}),
          ...(opts.descriptionField ? { descriptionField: String(opts.descriptionField) } : {}),
        });

        console.log(pc.bold(`${featurePath}`));
        for (const line of result.messages) {
          console.log("  " + line);
        }

        if (opts.writeTags) {
          const suiteTag =
            suite.context.mode === "multi" ? `${suiteTagPrefix}${suite.context.suiteId}` : undefined;
          const featureSectionTag = result.sectionId !== -1 ? `${sectionTagPrefix}${result.sectionId}` : undefined;
          const writeback = applyCaseTagsToFeatureText(text, feature, result.caseIdBySignature, {
            caseTagPrefix,
            sectionTagPrefix,
            ...(suiteTag ? { suiteTag } : {}),
            ...(featureSectionTag ? { featureSectionTag } : {}),
            ruleSectionIdsByName: result.ruleSectionIdsByName,
            outlineIs,
            exampleIs,
            exampleCaseTagPlacement,
            ...(result.outlineSectionIdsBySignature !== undefined ? { outlineSectionIdsBySignature: result.outlineSectionIdsBySignature } : {}),
            ...(result.exampleSectionIdsByKey !== undefined ? { exampleSectionIdsByKey: result.exampleSectionIdsByKey } : {}),
          });
          if (writeback.changed) {
            const formattedText = formatFeatureFile(writeback.updatedText);
            await fs.writeFile(filePath, formattedText, "utf8");
            console.log("  " + pc.green(`Wrote tags to ${featurePath}`));
          }
        }
        console.log("");
      }
    });
}

function registerLoginCommand(program: Command): void {
  program
    .command("login")
    .description("Store TestRail credentials securely on this device")
    .option("--testrail-url <url>", "TestRail base URL (e.g. https://testrail.example.com)")
    .option("--testrail-username <username>", "TestRail username")
    .option("--testrail-password <password>", "TestRail password / API key")
    .option("--project-id <id>", "Default TestRail project ID", (v) => Number(v))
    .action(async (opts) => {
      const enquirer = await import("enquirer");
      const prompt = enquirer.default?.prompt ?? enquirer.prompt;

      let url = opts.testrailUrl ?? process.env.TESTRAIL_URL;
      let username = opts.testrailUsername ?? process.env.TESTRAIL_USERNAME;
      let password = opts.testrailPassword ?? process.env.TESTRAIL_PASSWORD;
      let projectId = opts.projectId ?? (process.env.TESTRAIL_PROJECT_ID ? Number(process.env.TESTRAIL_PROJECT_ID) : undefined);

      // Prompt for any missing values
      if (!url) {
        const response = await prompt<{ url: string }>({
          type: "input",
          name: "url",
          message: "TestRail URL:",
        });
        url = response.url;
      }

      if (!username) {
        const response = await prompt<{ username: string }>({
          type: "input",
          name: "username",
          message: "TestRail username:",
        });
        username = response.username;
      }

      if (!password) {
        const response = await prompt<{ password: string }>({
          type: "password",
          name: "password",
          message: "TestRail password / API key:",
        });
        password = response.password;
      }

      if (projectId === undefined || Number.isNaN(projectId)) {
        const response = await prompt<{ projectId: string }>({
          type: "input",
          name: "projectId",
          message: "Default project ID (optional, press Enter to skip):",
        });
        if (response.projectId.trim()) {
          projectId = Number(response.projectId);
        }
      }

      if (!url || !username || !password) {
        console.error(pc.red("Error: URL, username, and password are required."));
        process.exitCode = 1;
        return;
      }

      const credentials: StoredCredentials = {
        url: url.trim(),
        username: username.trim(),
        password,
        ...(projectId !== undefined && !Number.isNaN(projectId) ? { projectId } : {}),
      };

      await saveCredentials(credentials);

      console.log(pc.green("Credentials saved to:"), getCredentialsFilePath());
      console.log(pc.dim("These will be used automatically when --testrail-* options are omitted."));
    });
}

function registerLogoutCommand(program: Command): void {
  program
    .command("logout")
    .description("Remove stored TestRail credentials from this device")
    .action(async () => {
      const removed = await clearCredentials();
      if (removed) {
        console.log(pc.green("Credentials removed:"), getCredentialsFilePath());
      } else {
        console.log(pc.dim("No stored credentials found."));
      }
    });
}

function registerSetUrlCommand(program: Command): void {
  program
    .command("set-url")
    .argument("<url>", "TestRail base URL (e.g. https://testrail.example.com)")
    .description("Update the stored TestRail URL without re-entering credentials")
    .action(async (url: string) => {
      const existing = await loadStoredCredentials();
      if (!existing) {
        console.error(pc.red("No stored credentials found. Run 'login' first."));
        process.exitCode = 1;
        return;
      }

      const updated: StoredCredentials = {
        ...existing,
        url: url.trim(),
      };

      await saveCredentials(updated);
      console.log(pc.green("URL updated:"), url.trim());
    });
}

function registerSetProjectCommand(program: Command): void {
  program
    .command("set-project")
    .argument("<id>", "Default TestRail project ID")
    .description("Update the stored default project ID without re-entering credentials")
    .action(async (id: string) => {
      const projectId = Number(id);
      if (Number.isNaN(projectId)) {
        console.error(pc.red("Invalid project ID. Must be a number."));
        process.exitCode = 1;
        return;
      }

      const existing = await loadStoredCredentials();
      if (!existing) {
        console.error(pc.red("No stored credentials found. Run 'login' first."));
        process.exitCode = 1;
        return;
      }

      const updated: StoredCredentials = {
        ...existing,
        projectId,
      };

      await saveCredentials(updated);
      console.log(pc.green("Default project ID updated:"), projectId);
    });
}

function registerSetCaseTagPrefixCommand(program: Command): void {
  program
    .command("set-case-tag-prefix")
    .argument("<prefix>", "Case ID tag prefix (e.g. @testrail-case- or @C)")
    .description("Update the stored case tag prefix without re-entering credentials")
    .action(async (prefix: string) => {
      const existing = await loadStoredCredentials();
      if (!existing) {
        console.error(pc.red("No stored credentials found. Run 'login' first."));
        process.exitCode = 1;
        return;
      }

      const updated: StoredCredentials = {
        ...existing,
        caseTagPrefix: prefix,
      };

      await saveCredentials(updated);
      console.log(pc.green("Case tag prefix updated:"), prefix);
    });
}

function registerSetSuiteTagPrefixCommand(program: Command): void {
  program
    .command("set-suite-tag-prefix")
    .argument("<prefix>", "Suite ID tag prefix (e.g. @testrail-suite- or @S)")
    .description("Update the stored suite tag prefix without re-entering credentials")
    .action(async (prefix: string) => {
      const existing = await loadStoredCredentials();
      if (!existing) {
        console.error(pc.red("No stored credentials found. Run 'login' first."));
        process.exitCode = 1;
        return;
      }

      const updated: StoredCredentials = {
        ...existing,
        suiteTagPrefix: prefix,
      };

      await saveCredentials(updated);
      console.log(pc.green("Suite tag prefix updated:"), prefix);
    });
}

function registerSetSectionTagPrefixCommand(program: Command): void {
  program
    .command("set-section-tag-prefix")
    .argument("<prefix>", "Section ID tag prefix (e.g. @testrail-section- or @SEC)")
    .description("Update the stored section tag prefix without re-entering credentials")
    .action(async (prefix: string) => {
      const existing = await loadStoredCredentials();
      if (!existing) {
        console.error(pc.red("No stored credentials found. Run 'login' first."));
        process.exitCode = 1;
        return;
      }

      const updated: StoredCredentials = {
        ...existing,
        sectionTagPrefix: prefix,
      };

      await saveCredentials(updated);
      console.log(pc.green("Section tag prefix updated:"), prefix);
    });
}

function registerSetOutlineIsCommand(program: Command): void {
  program
    .command("set-outline-is")
    .argument("<mode>", 'How to treat scenario outlines: "case" or "section"')
    .description("Update the stored outline handling mode without re-entering credentials")
    .action(async (mode: string) => {
      if (mode !== "case" && mode !== "section") {
        console.error(pc.red('Invalid mode. Must be "case" or "section".'));
        process.exitCode = 1;
        return;
      }

      const existing = await loadStoredCredentials();
      if (!existing) {
        console.error(pc.red("No stored credentials found. Run 'login' first."));
        process.exitCode = 1;
        return;
      }

      const updated: StoredCredentials = {
        ...existing,
        outlineIs: mode,
      };

      await saveCredentials(updated);
      console.log(pc.green("Outline handling mode updated:"), mode);
    });
}

function registerSetExampleIsCommand(program: Command): void {
  program
    .command("set-example-is")
    .argument("<mode>", 'When outline-is=section, how to treat Examples: "case" or "section"')
    .description("Update the stored example handling mode without re-entering credentials")
    .action(async (mode: string) => {
      if (mode !== "case" && mode !== "section") {
        console.error(pc.red('Invalid mode. Must be "case" or "section".'));
        process.exitCode = 1;
        return;
      }

      const existing = await loadStoredCredentials();
      if (!existing) {
        console.error(pc.red("No stored credentials found. Run 'login' first."));
        process.exitCode = 1;
        return;
      }

      const updated: StoredCredentials = {
        ...existing,
        exampleIs: mode,
      };

      await saveCredentials(updated);
      console.log(pc.green("Example handling mode updated:"), mode);
    });
}

function registerSetExampleCaseTagPlacementCommand(program: Command): void {
  program
    .command("set-example-case-tag-placement")
    .argument("<placement>", 'Where to place case tags for example rows: "above" or "inline"')
    .description("Update the stored example case tag placement without re-entering credentials")
    .action(async (placement: string) => {
      if (placement !== "above" && placement !== "inline") {
        console.error(pc.red('Invalid placement. Must be "above" or "inline".'));
        process.exitCode = 1;
        return;
      }

      const existing = await loadStoredCredentials();
      if (!existing) {
        console.error(pc.red("No stored credentials found. Run 'login' first."));
        process.exitCode = 1;
        return;
      }

      const updated: StoredCredentials = {
        ...existing,
        exampleCaseTagPlacement: placement,
      };

      await saveCredentials(updated);
      console.log(pc.green("Example case tag placement updated:"), placement);
    });
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
    .option(
      "--outline-is <mode>",
      'How to treat scenario outlines: "case" (one case per outline) or "section" (outline becomes a section)'
    )
    .option(
      "--example-is <mode>",
      'When outline-is=section, how to treat Examples: "case" (rows as cases) or "section" (Examples as subsections)'
    )
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

      const stored = await loadStoredCredentials();
      const outlineIs = resolveOutlineIs(opts.outlineIs, stored?.outlineIs);
      const exampleIs = resolveExampleIs(opts.exampleIs, stored?.exampleIs);

      const existingCases = await loadExistingCases(opts.existingCases);

      const suite = await maybeResolveSuite(opts);

      if (suite?.messages?.length) {
        for (const line of suite.messages) {
          console.log(line);
        }
        console.log("");
      }

      const filePaths = await resolveFeatureFiles(patterns);
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
          outlineIs,
          exampleIs,
        });

        const heading = pc.bold(`${featurePath}`);
        console.log(heading);
        for (const line of formatPlanVerboseWithSuite(plan, suite)) {
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

/**
 * Resolve outlineIs with priority: CLI flag > stored credentials > default ("case")
 */
function resolveOutlineIs(
  cliValue: unknown,
  storedValue: "case" | "section" | undefined
): "case" | "section" {
  if (cliValue === "case" || cliValue === "section") {
    return cliValue;
  }
  if (cliValue !== undefined && cliValue !== null && cliValue !== "") {
    throw new Error(`Invalid --outline-is: ${String(cliValue)}. Must be "case" or "section".`);
  }
  return storedValue ?? "case";
}

/**
 * Resolve exampleIs with priority: CLI flag > stored credentials > default ("case")
 */
function resolveExampleIs(
  cliValue: unknown,
  storedValue: "case" | "section" | undefined
): "case" | "section" {
  if (cliValue === "case" || cliValue === "section") {
    return cliValue;
  }
  if (cliValue !== undefined && cliValue !== null && cliValue !== "") {
    throw new Error(`Invalid --example-is: ${String(cliValue)}. Must be "case" or "section".`);
  }
  return storedValue ?? "case";
}

/**
 * Resolve exampleCaseTagPlacement with priority: CLI flag > stored credentials > default ("above")
 */
function resolveExampleCaseTagPlacement(
  cliValue: unknown,
  storedValue: "above" | "inline" | undefined
): "above" | "inline" {
  if (cliValue === "above" || cliValue === "inline") {
    return cliValue;
  }
  if (cliValue !== undefined && cliValue !== null && cliValue !== "") {
    throw new Error(`Invalid --example-case-tag-placement: ${String(cliValue)}. Must be "above" or "inline".`);
  }
  return storedValue ?? "above";
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

async function maybeResolveSuite(opts: TestRailCliOptions): Promise<SuiteResolution | undefined> {
  const stored = await loadStoredCredentials();

  const url = opts.testrailUrl ?? process.env.TESTRAIL_URL ?? stored?.url;
  const username = opts.testrailUsername ?? process.env.TESTRAIL_USERNAME ?? stored?.username;
  const password = opts.testrailPassword ?? process.env.TESTRAIL_PASSWORD ?? stored?.password;
  const projectId =
    opts.projectId ??
    (process.env.TESTRAIL_PROJECT_ID ? Number(process.env.TESTRAIL_PROJECT_ID) : undefined) ??
    stored?.projectId;

  if (!url || !username || !password || projectId === undefined || Number.isNaN(projectId)) {
    return undefined;
  }

  const client = new HttpTestRailClient({ url, username, password });

  return resolveSuiteContext(client, projectId, {
    ...(opts.suiteId !== undefined ? { suiteId: opts.suiteId } : {}),
    ...(opts.suiteName !== undefined ? { suiteName: opts.suiteName } : {}),
    ...(opts.defaultSuiteName !== undefined ? { defaultSuiteName: opts.defaultSuiteName } : {}),
    createMissingSuite: Boolean(opts.createMissingSuite),
    // For the plan command, default to non-strict warnings.
    strict: false,
  });
}

async function requireClientAsync(
  opts: TestRailCliOptions
): Promise<{ client: HttpTestRailClient; projectId: number }> {
  // Priority: CLI flags > env vars > stored credentials
  const stored = await loadStoredCredentials();

  const url = opts.testrailUrl ?? process.env.TESTRAIL_URL ?? stored?.url;
  const username = opts.testrailUsername ?? process.env.TESTRAIL_USERNAME ?? stored?.username;
  const password = opts.testrailPassword ?? process.env.TESTRAIL_PASSWORD ?? stored?.password;
  const projectId =
    opts.projectId ??
    (process.env.TESTRAIL_PROJECT_ID ? Number(process.env.TESTRAIL_PROJECT_ID) : undefined) ??
    stored?.projectId;

  if (!url || !username || !password) {
    throw new Error(
      "Missing TestRail credentials. Run `testrail-cucumber login` or provide --testrail-url/--testrail-username/--testrail-password or set TESTRAIL_URL/TESTRAIL_USERNAME/TESTRAIL_PASSWORD."
    );
  }
  if (projectId === undefined || Number.isNaN(projectId)) {
    throw new Error("Missing --project-id (or TESTRAIL_PROJECT_ID).");
  }

  return { client: new HttpTestRailClient({ url, username, password }), projectId };
}

function toRepoRelative(filePath: string): string {
  const rel = path.relative(process.cwd(), filePath);
  // Use forward slashes for stable signatures across OSes.
  return rel.split(path.sep).join("/");
}

function toGlobPath(input: string): string {
  return input.split(path.sep).join("/");
}

async function resolveFeatureFiles(inputs: readonly string[]): Promise<string[]> {
  const patterns: string[] = [];

  for (const input of inputs) {
    const absolutePath = path.resolve(process.cwd(), input);
    try {
      const stats = await fs.stat(absolutePath);
      if (stats.isDirectory()) {
        patterns.push(toGlobPath(path.join(input, "**/*.feature")));
        continue;
      }
      if (stats.isFile()) {
        if (!input.endsWith(".feature")) {
          throw new Error(`Expected a .feature file, got: ${input}`);
        }
        patterns.push(toGlobPath(input));
        continue;
      }
    } catch {
      patterns.push(toGlobPath(input));
    }
  }

  return fg(patterns, { onlyFiles: true, unique: true, dot: false, cwd: process.cwd() });
}
