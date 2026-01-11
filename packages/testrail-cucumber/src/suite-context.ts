import pc from "picocolors";
import type { TestRailClient, TestRailSuite } from "./client";

export type SuiteContext =
  | { readonly mode: "single"; readonly projectId: number }
  | { readonly mode: "multi"; readonly projectId: number; readonly suiteId: number; readonly suiteName: string };

export interface SuiteResolution {
  readonly context: SuiteContext;
  readonly messages: readonly string[];
  /** Tag we intend to apply to cases/scenarios when in multi-suite mode. */
  readonly suiteTag?: string;
  /** True when we had to create a suite (multi-suite only). */
  readonly createdSuite?: boolean;
}

export interface ResolveSuiteContextOptions {
  readonly suiteId?: number;
  readonly suiteName?: string;
  readonly defaultSuiteName?: string;
  /**
   * When resolving by suiteName/defaultSuiteName in a multi-suite project, allow creating
   * the suite if it does not exist.
   *
   * Set to false for dry-run mode if you want to avoid side-effects.
   */
  readonly createMissingSuite?: boolean;
  readonly strict?: boolean;
}

export async function resolveSuiteContext(
  client: TestRailClient,
  projectId: number,
  options: ResolveSuiteContextOptions = {}
): Promise<SuiteResolution> {
  const messages: string[] = [];
  const createMissingSuite = options.createMissingSuite ?? true;
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

    messages.push(`[testrail] Project ${projectId} is single-suite (suite_mode=${suiteMode}); using default suite.`);
    return { context: { mode: "single", projectId }, messages };
  }

  // Multi-suite
  const suites = await client.getSuites(projectId);

  if (options.suiteId !== undefined) {
    const existing = suites.find((suite) => suite.id === options.suiteId);
    if (!existing) {
      throw new Error(`[testrail] Suite ${options.suiteId} not found in project ${projectId}.`);
    }
    const suiteTag = buildSuiteTag(existing.id);
    messages.push(`[testrail] Using existing suite "${existing.name}" (#${existing.id}) in project ${projectId}.`);
    messages.push(`[testrail] Will apply suite tag ${suiteTag} for multi-suite traceability.`);
    return {
      context: { mode: "multi", projectId, suiteId: existing.id, suiteName: existing.name },
      messages,
      suiteTag,
      createdSuite: false,
    };
  }

  if (options.suiteName !== undefined) {
    const { suite, created } = await findOrCreateSuite(client, projectId, suites, options.suiteName, createMissingSuite);
    const suiteTag = buildSuiteTag(suite.id);
    messages.push(
      created
        ? `[testrail] Created suite "${suite.name}" (#${suite.id}) in project ${projectId}.`
        : `[testrail] Using existing suite "${suite.name}" (#${suite.id}) in project ${projectId}.`
    );
    messages.push(`[testrail] Will apply suite tag ${suiteTag} for multi-suite traceability.`);
    return {
      context: { mode: "multi", projectId, suiteId: suite.id, suiteName: suite.name },
      messages,
      suiteTag,
      createdSuite: created,
    };
  }

  if (options.defaultSuiteName !== undefined) {
    const { suite, created } = await findOrCreateSuite(
      client,
      projectId,
      suites,
      options.defaultSuiteName,
      createMissingSuite
    );
    const suiteTag = buildSuiteTag(suite.id);
    messages.push(
      created
        ? `[testrail] Created suite "${suite.name}" (#${suite.id}) in project ${projectId}.`
        : `[testrail] Using existing suite "${suite.name}" (#${suite.id}) in project ${projectId}.`
    );
    messages.push(`[testrail] Will apply suite tag ${suiteTag} for multi-suite traceability.`);
    return {
      context: { mode: "multi", projectId, suiteId: suite.id, suiteName: suite.name },
      messages,
      suiteTag,
      createdSuite: created,
    };
  }

  throw new Error(
    `[testrail] Project is multi-suite (suite_mode=${suiteMode}). Provide --suite-id or --suite-name to proceed.`
  );
}

async function findOrCreateSuite(
  client: TestRailClient,
  projectId: number,
  suites: readonly TestRailSuite[],
  name: string,
  createMissingSuite: boolean
): Promise<{ suite: TestRailSuite; created: boolean }> {
  const existing = suites.find((suite) => suite.name === name);
  if (existing) {
    return { suite: existing, created: false };
  }

  if (!createMissingSuite) {
    throw new Error(
      `[testrail] Suite "${name}" not found in project ${projectId}. Re-run with createMissingSuite enabled (non-dry-run) or provide --suite-id.`
    );
  }

  const suite = await client.addSuite(projectId, { name });
  return { suite, created: true };
}

function buildSuiteTag(suiteId: number): string {
  return `@S${suiteId}`;
}
