import type { ParsedFeature, ScenarioNode, ScenarioOutlineNode } from "./types";
import { computeScenarioSignature } from "./signature";
import type { CandidateCase, DuplicatePolicy, DuplicateResolution } from "./duplicate-policy";
import { resolveDuplicate } from "./duplicate-policy";
import type { TestRailClient } from "./client";
import pc from "picocolors";

export interface ExistingCase {
  readonly id: number;
  readonly title?: string;
  readonly suiteName?: string;
  readonly sectionPath?: string;
  readonly signature?: string;
  readonly firstStep?: string;
}

export interface MatchResult {
  readonly action: "use" | "create" | "skip" | "error";
  readonly caseId?: number;
  readonly message?: string;
}

export interface MatchOptions {
  readonly feature: ParsedFeature;
  readonly node: ScenarioNode | ScenarioOutlineNode;
  readonly duplicatePolicy: DuplicatePolicy;
  readonly interactive?: boolean;
  readonly forcePrompt?: boolean;
  readonly maxPromptCandidates?: number;
  readonly existingCases: readonly ExistingCase[];
}

export async function matchCase(options: MatchOptions): Promise<MatchResult> {
  const { feature, node, existingCases, duplicatePolicy, interactive, forcePrompt, maxPromptCandidates } = options;

  const signature = computeScenarioSignature({
    featurePath: feature.path,
    kind: node.kind,
    title: node.name,
    steps: node.steps,
    backgroundSteps: node.backgroundSteps,
    ...(node.kind === "outline"
      ? { exampleTables: node.examples.map((ex) => ({ headers: ex.headers, rowCount: ex.rows.length })) }
      : {}),
  });

  const exactMatches = existingCases.filter((c) => c.signature === signature);

  if (exactMatches.length === 1) {
    return { action: "use", caseId: exactMatches[0]!.id };
  }

  if (exactMatches.length > 1) {
    const resolution = await resolveDuplicate({
      policy: duplicatePolicy,
      candidates: toCandidates(exactMatches),
      signature,
      pc,
      ...(interactive !== undefined ? { interactive } : {}),
      ...(forcePrompt !== undefined ? { forcePrompt } : {}),
      ...(maxPromptCandidates !== undefined ? { maxPromptCandidates } : {}),
    });
    return normalizeResolution(resolution);
  }

  // No signature match: fall back to title match within the same feature path (best-effort)
  const titleMatches = existingCases.filter((c) => (c.title ?? "").trim() === node.name.trim());

  if (titleMatches.length <= 1) {
    return titleMatches.length === 1
      ? { action: "use", caseId: titleMatches[0]!.id }
      : { action: "create" };
  }

  // Multiple title matches, resolve by policy
  const resolution = await resolveDuplicate({
    policy: duplicatePolicy,
    candidates: toCandidates(titleMatches),
    signature,
    pc,
    ...(interactive !== undefined ? { interactive } : {}),
    ...(forcePrompt !== undefined ? { forcePrompt } : {}),
    ...(maxPromptCandidates !== undefined ? { maxPromptCandidates } : {}),
  });
  return normalizeResolution(resolution);
}

function toCandidates(cases: readonly ExistingCase[]): CandidateCase[] {
  return cases.map((c) => ({
    id: c.id,
    ...(c.suiteName !== undefined ? { suiteName: c.suiteName } : {}),
    ...(c.sectionPath !== undefined ? { sectionPath: c.sectionPath } : {}),
    ...(c.title !== undefined ? { title: c.title } : {}),
    ...(c.signature !== undefined ? { signature: c.signature } : {}),
    ...(c.firstStep !== undefined ? { firstStep: c.firstStep } : {}),
  }));
}

function normalizeResolution(res: DuplicateResolution): MatchResult {
  switch (res.action) {
    case "use":
      return { action: "use", caseId: res.caseId };
    case "create":
      return { action: "create" };
    case "skip":
      return { action: "skip" };
    case "error":
      return { action: "error", message: res.message };
  }
}
