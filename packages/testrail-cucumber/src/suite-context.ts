import pc from "picocolors";
import type { TestRailClient, TestRailSuite } from "./client";

export type SuiteContext =
  | { readonly mode: "single"; readonly projectId: number }
  | { readonly mode: "multi"; readonly projectId: number; readonly suiteId: number; readonly suiteName: string };

export interface ResolveSuiteContextOptions {
  readonly suiteId?: number;
  readonly suiteName?: string;
  readonly defaultSuiteName?: string;
  readonly strict?: boolean;
}

export async function resolveSuiteContext(
  client: TestRailClient,
  projectId: number,
  options: ResolveSuiteContextOptions = {}
): Promise<SuiteContext> {
  const project = await client.getProject(projectId);
  const suiteMode = project.suite_mode;

  if (suiteMode !== 3) {
    if (options.suiteId !== undefined) {
      const message = `[testrail] Project is single-suite (suite_mode=${suiteMode}). Ignoring provided suiteId=${options.suiteId}.`;
      if (options.strict === true) {
        throw new Error(message);
      }
      console.warn(pc.yellow(message));
    }
    if (options.suiteName !== undefined) {
      const message = `[testrail] Project is single-suite (suite_mode=${suiteMode}). Ignoring provided suiteName=${options.suiteName}.`;
      if (options.strict === true) {
        throw new Error(message);
      }
      console.warn(pc.yellow(message));
    }

    return { mode: "single", projectId };
  }

  // Multi-suite
  const suites = await client.getSuites(projectId);

  if (options.suiteId !== undefined) {
    const existing = suites.find((suite) => suite.id === options.suiteId);
    if (!existing) {
      throw new Error(`[testrail] Suite ${options.suiteId} not found in project ${projectId}.`);
    }
    return { mode: "multi", projectId, suiteId: existing.id, suiteName: existing.name };
  }

  if (options.suiteName !== undefined) {
    const resolved = await findOrCreateSuite(client, projectId, suites, options.suiteName);
    return { mode: "multi", projectId, suiteId: resolved.id, suiteName: resolved.name };
  }

  if (options.defaultSuiteName !== undefined) {
    const resolved = await findOrCreateSuite(client, projectId, suites, options.defaultSuiteName);
    return { mode: "multi", projectId, suiteId: resolved.id, suiteName: resolved.name };
  }

  throw new Error(
    `[testrail] Project is multi-suite (suite_mode=${suiteMode}). Provide --suite-id or --suite-name to proceed.`
  );
}

async function findOrCreateSuite(
  client: TestRailClient,
  projectId: number,
  suites: readonly TestRailSuite[],
  name: string
): Promise<TestRailSuite> {
  const existing = suites.find((suite) => suite.name === name);
  if (existing) {
    return existing;
  }
  return client.addSuite(projectId, { name });
}
