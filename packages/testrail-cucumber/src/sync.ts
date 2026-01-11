import pc from "picocolors";

import type { ParsedFeature, FeatureChildNode, ScenarioNode, ScenarioOutlineNode } from "./types";
import type { DuplicatePolicy } from "./duplicate-policy";
import type { ExistingCase } from "./matcher";
import type { SuiteResolution } from "./suite-context";
import type { TestRailClient, TestRailCase, TestRailSection } from "./client";

import { buildPlan, type PlanItem } from "./plan";
import { computeScenarioSignature } from "./signature";
import { toSeparatedSteps } from "./steps";
import { ensureRefsContain, toExistingCaseFromTestRail } from "./testrail-mapping";

export interface SyncOptions {
  readonly duplicatePolicy: DuplicatePolicy;
  readonly interactive?: boolean;
  readonly forcePrompt?: boolean;
  readonly maxPromptCandidates?: number;

  /** If true, do not mutate TestRail or feature files; only return the plan + messages. */
  readonly dryRun?: boolean;
  /** If true, update existing cases (steps/description/title) when reusing a match. */
  readonly updateExisting?: boolean;

  /**
   * Which field to use for storing separated steps.
   * Most TestRail instances using the separated steps template use `custom_steps_separated`.
   */
  readonly stepsField?: string;
  /** Field for the long description (commonly `custom_test_case_description`). */
  readonly descriptionField?: string;
  /** Store our signature in `refs` by default; can be overridden for custom fields later. */
  readonly signatureToRefs?: boolean;
}

export interface FeatureSyncResult {
  readonly featurePath: string;
  readonly sectionId: number;
  readonly suite?: SuiteResolution;
  readonly plan: readonly PlanItem[];
  /** Mapping from scenario signature to the resolved TestRail case id (after create/reuse). */
  readonly caseIdBySignature: Readonly<Record<string, number>>;
  readonly createdCases: readonly TestRailCase[];
  readonly updatedCases: readonly TestRailCase[];
  readonly messages: readonly string[];
}

export async function syncFeatureToTestRail(
  client: TestRailClient,
  suite: SuiteResolution,
  feature: ParsedFeature,
  projectId: number,
  options: SyncOptions
): Promise<FeatureSyncResult> {
  const messages: string[] = [];
  const dryRun = options.dryRun === true;

  const suiteId = suite.context.mode === "multi" ? suite.context.suiteId : undefined;

  const section = await ensureFeatureSection(client, projectId, feature, suiteId, { dryRun });
  if (section.id === -1) {
    messages.push(`[testrail] No existing section found for feature ${feature.path}; would create a new section in non-dry-run mode.`);
  } else {
    messages.push(`[testrail] Using section #${section.id} for feature ${feature.path} (${feature.name}).`);
  }

  const existingCases =
    section.id === -1
      ? []
      : await loadExistingCases(client, projectId, {
          ...(suiteId !== undefined ? { suiteId } : {}),
          sectionId: section.id,
        });

  const plan = await buildPlan({
    feature,
    existingCases,
    duplicatePolicy: options.duplicatePolicy,
    ...(options.interactive !== undefined ? { interactive: options.interactive } : {}),
    ...(options.forcePrompt !== undefined ? { forcePrompt: options.forcePrompt } : {}),
    ...(options.maxPromptCandidates !== undefined ? { maxPromptCandidates: options.maxPromptCandidates } : {}),
  });

  const nodeBySignature = new Map<string, FeatureChildNode>();
  for (const node of feature.children) {
    const sig = computeScenarioSignature({
      featurePath: feature.path,
      kind: node.kind,
      title: node.name,
      steps: node.steps,
      backgroundSteps: node.backgroundSteps,
      ...(node.kind === "outline"
        ? { exampleTables: node.examples.map((ex) => ({ headers: ex.headers, rowCount: ex.rows.length })) }
        : {}),
    });
    nodeBySignature.set(sig, node);
  }

  if (dryRun) {
    const reuseEntries = plan
      .filter((p): p is PlanItem & { caseId: number } => p.action === "use" && typeof p.caseId === "number")
      .map((p) => [p.signature, p.caseId] as const);
    const reuseMap = Object.fromEntries(reuseEntries);
    return {
      featurePath: feature.path,
      sectionId: section.id,
      suite,
      plan,
      caseIdBySignature: reuseMap,
      createdCases: [],
      updatedCases: [],
      messages,
    };
  }

  const createdCases: TestRailCase[] = [];
  const updatedCases: TestRailCase[] = [];
  const caseIdBySignature = new Map<string, number>();

  for (const item of plan) {
    if (item.action === "error") {
      throw new Error(item.message ?? "Plan contains error item");
    }

    if (item.action === "skip") {
      messages.push(pc.yellow(`[testrail] Skip ${item.nodeName} (${item.signature}).`));
      continue;
    }

    const node = nodeBySignature.get(item.signature);
    if (!node) {
      throw new Error(`[testrail] Internal error: node not found for plan item signature: ${item.nodeName} (${item.signature})`);
    }

    if (item.action === "create") {
      const created = await client.addCase(section.id, buildCasePayload(feature, node, item.signature, suite, options));
      createdCases.push(created);
      caseIdBySignature.set(item.signature, created.id);
      messages.push(pc.green(`[testrail] Created case #${created.id} for ${item.nodeName}.`));
      continue;
    }

    // use
    const caseId = item.caseId;
    if (caseId === undefined) {
      throw new Error(`[testrail] Internal error: plan item missing caseId for use action (${item.nodeName}).`);
    }

    caseIdBySignature.set(item.signature, caseId);

    // Always ensure signature is present; optionally update content.
    const payload = buildCasePayload(feature, node, item.signature, suite, options);

    if (options.updateExisting === true) {
      if (options.signatureToRefs !== false) {
        const current = await client.getCase(caseId);
        const nextRefs = ensureRefsContain(typeof current.refs === "string" ? current.refs : undefined, item.signature);
        payload.refs = nextRefs;
      }
      const updated = await client.updateCase(caseId, payload);
      updatedCases.push(updated);
      messages.push(pc.cyan(`[testrail] Updated case #${caseId} for ${item.nodeName}.`));
    } else if (options.signatureToRefs !== false) {
      // Minimal update: ensure refs contains signature (preserve existing refs)
      const current = await client.getCase(caseId);
      const nextRefs = ensureRefsContain(typeof current.refs === "string" ? current.refs : undefined, item.signature);
      const updated = await client.updateCase(caseId, { refs: nextRefs });
      updatedCases.push(updated);
      messages.push(pc.cyan(`[testrail] Tagged case #${caseId} with signature for ${item.nodeName}.`));
    } else {
      messages.push(pc.cyan(`[testrail] Reusing case #${caseId} for ${item.nodeName}.`));
    }
  }

  return {
    featurePath: feature.path,
    sectionId: section.id,
    suite,
    plan,
    caseIdBySignature: Object.fromEntries(caseIdBySignature.entries()),
    createdCases,
    updatedCases,
    messages,
  };
}

async function ensureFeatureSection(
  client: TestRailClient,
  projectId: number,
  feature: ParsedFeature,
  suiteId: number | undefined,
  opts: { readonly dryRun: boolean }
): Promise<TestRailSection> {
  const sections = await client.getSections(projectId, { ...(suiteId !== undefined ? { suiteId } : {}) });

  const pathMarker = `autometa:featurePath=${feature.path}`;
  const byPath = sections.filter((s) => (s.description ?? "").includes(pathMarker));
  if (byPath.length > 0) {
    const first = byPath[0];
    if (first) {
      if (byPath.length === 1) {
        return first;
      }
      const named = byPath.find((s) => s.name.trim() === feature.name.trim());
      return named ?? first;
    }
  }

  const matches = sections.filter((s) => s.name.trim() === feature.name.trim());
  if (matches.length > 0) {
    const first = matches[0];
    if (first) {
      if (matches.length === 1) {
        return first;
      }

      // Best effort: prefer one with description containing feature path.
      const withPath = matches.find((s) => (s.description ?? "").includes(feature.path));
      return withPath ?? first;
    }
  }

  if (opts.dryRun) {
    // Fake section id for output only.
    return { id: -1, name: feature.name, description: featureDescription(feature) };
  }

  return client.addSection(projectId, {
    name: feature.name,
    description: featureDescription(feature),
    ...(suiteId !== undefined ? { suite_id: suiteId } : {}),
  });
}

function featureDescription(feature: ParsedFeature): string {
  const parts = [
    feature.description?.trim() ? feature.description.trim() : undefined,
    `autometa:featurePath=${feature.path}`,
  ].filter(Boolean);
  return parts.join("\n\n");
}

async function loadExistingCases(
  client: TestRailClient,
  projectId: number,
  options: { readonly suiteId?: number; readonly sectionId?: number }
): Promise<ExistingCase[]> {
  const cases = await client.getCases(projectId, options);
  return cases.map(toExistingCaseFromTestRail);
}

function buildCasePayload(
  feature: ParsedFeature,
  node: FeatureChildNode,
  signature: string,
  suite: SuiteResolution,
  options: SyncOptions
): Record<string, unknown> {
  const stepsField = options.stepsField ?? "custom_steps_separated";
  const descriptionField = options.descriptionField ?? "custom_test_case_description";

  const steps = [...(node.backgroundSteps ?? []), ...(node.steps ?? [])];

  const payload: Record<string, unknown> = {
    title: node.name,
    [descriptionField]: node.description ?? feature.description ?? "",
    [stepsField]: toSeparatedSteps(steps),
  };

  if (options.signatureToRefs !== false) {
    payload.refs = signature;
  }

  // NOTE: suiteTag is intended for feature/scenario tags (write-back); we don't push it into TestRail by default.
  // It remains available in SuiteResolution for CLI messaging and future tag write-back.
  void suite;

  return payload;
}

export function computeNodeSignature(feature: ParsedFeature, node: ScenarioNode | ScenarioOutlineNode): string {
  return computeScenarioSignature({
    featurePath: feature.path,
    kind: node.kind,
    title: node.name,
    steps: node.steps,
    backgroundSteps: node.backgroundSteps,
    ...(node.kind === "outline"
      ? { exampleTables: node.examples.map((ex) => ({ headers: ex.headers, rowCount: ex.rows.length })) }
      : {}),
  });
}
