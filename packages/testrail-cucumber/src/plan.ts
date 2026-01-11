import type { ParsedFeature, FeatureChildNode } from "./types";
import type { ExistingCase, MatchResult } from "./matcher";
import { matchCase } from "./matcher";
import type { SuiteResolution } from "./suite-context";

export interface PlanItem {
  readonly featurePath: string;
  readonly nodeName: string;
  readonly kind: FeatureChildNode["kind"];
  readonly action: MatchResult["action"];
  readonly signature: string;
  readonly caseId?: number;
  readonly message?: string;
}

export interface BuildPlanOptions {
  readonly feature: ParsedFeature;
  readonly existingCases: readonly ExistingCase[];
  readonly duplicatePolicy: Parameters<typeof matchCase>[0]["duplicatePolicy"];
  readonly interactive?: boolean;
  readonly forcePrompt?: boolean;
  readonly maxPromptCandidates?: number;
}

export async function buildPlan(options: BuildPlanOptions): Promise<PlanItem[]> {
  const { feature, existingCases, duplicatePolicy, interactive, forcePrompt, maxPromptCandidates } = options;
  const items: PlanItem[] = [];

  for (const node of feature.children) {
    const result = await matchCase({
      feature,
      node,
      existingCases,
      duplicatePolicy,
      ...(interactive !== undefined ? { interactive } : {}),
      ...(forcePrompt !== undefined ? { forcePrompt } : {}),
      ...(maxPromptCandidates !== undefined ? { maxPromptCandidates } : {}),
    });

    items.push({
      featurePath: feature.path,
      nodeName: node.name,
      kind: node.kind,
      action: result.action,
      signature: result.signature,
      ...(result.caseId !== undefined ? { caseId: result.caseId } : {}),
      ...(result.message !== undefined ? { message: result.message } : {}),
    });
  }

  return items;
}

export function formatDryRun(plan: readonly PlanItem[]): string[] {
  return plan.map((item) => {
    const base = `${item.featurePath} :: ${item.nodeName}`;
    switch (item.action) {
      case "use":
        return `${base} -> reuse case #${item.caseId} (${item.signature})`;
      case "create":
        return `${base} -> create new (${item.signature})`;
      case "skip":
        return `${base} -> skip (${item.signature})`;
      case "error":
        return `${base} -> error: ${item.message ?? "(unknown)"}`;
    }
  });
}

/**
 * More explicit, human-friendly messages suitable for CLI output.
 */
export function formatPlanVerbose(plan: readonly PlanItem[]): string[] {
  return plan.map((item) => {
    const context = `"${item.nodeName}" in ${item.featurePath}`;
    switch (item.action) {
      case "use":
        return `Reuse existing case #${item.caseId} for ${context} (signature ${item.signature})`;
      case "create":
        return `Create new case for ${context} (signature ${item.signature})`;
      case "skip":
        return `Skip ${context} (signature ${item.signature})`;
      case "error":
        return `Error for ${context}: ${item.message ?? "(unknown)"}`;
    }
  });
}

/**
 * Compose suite-context messages (if any) with the verbose plan lines.
 * Useful for CLI dry-run output to show suite selection/creation and tag application notes.
 */
export function formatPlanVerboseWithSuite(plan: readonly PlanItem[], suite?: SuiteResolution): string[] {
  const header = suite?.messages ?? [];
  return [...header, ...formatPlanVerbose(plan)];
}
