import type { ParsedFeature, FeatureChildNode, OutlineRowNode, ScenarioOutlineNode } from "./types";
import type { ExistingCase, MatchResult } from "./matcher";
import { matchCase } from "./matcher";
import type { SuiteResolution } from "./suite-context";
import { expandOutlineRows } from "./parser";
import { computeScenarioSignature, computeRowSignature } from "./signature";

export interface PlanItem {
  readonly featurePath: string;
  readonly nodeName: string;
  readonly kind: FeatureChildNode["kind"];
  readonly action: MatchResult["action"];
  readonly signature: string;
  readonly caseId?: number;
  readonly message?: string;
  /**
   * For row cases and example sections, links back to the parent outline/example section.
   */
  readonly parentSignature?: string;
  /**
   * The item type: "case" for test cases, "section" for sections (outline or example).
   */
  readonly itemType?: "case" | "section";
  /**
   * For example sections, the 0-based index of the Examples table.
   */
  readonly exampleIndex?: number;
}

export interface BuildPlanOptions {
  readonly feature: ParsedFeature;
  readonly existingCases: readonly ExistingCase[];
  readonly duplicatePolicy: Parameters<typeof matchCase>[0]["duplicatePolicy"];
  readonly interactive?: boolean;
  readonly forcePrompt?: boolean;
  readonly maxPromptCandidates?: number;
  readonly outlineIs?: "case" | "section";
  readonly exampleIs?: "case" | "section";
}

export async function buildPlan(options: BuildPlanOptions): Promise<PlanItem[]> {
  const {
    feature,
    existingCases,
    duplicatePolicy,
    interactive,
    forcePrompt,
    maxPromptCandidates,
    outlineIs = "case",
    exampleIs = "case",
  } = options;
  const items: PlanItem[] = [];

  for (const node of feature.children) {
    // Handle outline expansion when outlineIs=section
    if (node.kind === "outline" && outlineIs === "section") {
      const matchOpts = {
        duplicatePolicy,
        ...(interactive !== undefined ? { interactive } : {}),
        ...(forcePrompt !== undefined ? { forcePrompt } : {}),
        ...(maxPromptCandidates !== undefined ? { maxPromptCandidates } : {}),
      };
      const outlineItems = await buildOutlineSectionPlan(
        feature,
        node,
        existingCases,
        matchOpts,
        exampleIs
      );
      items.push(...outlineItems);
      continue;
    }

    // Skip outline-row nodes here (they're handled by buildOutlineSectionPlan)
    if (node.kind === "outline-row") {
      continue;
    }

    // Default case-based handling for scenarios and outlines (when outlineIs=case)
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
      itemType: "case",
      ...(result.caseId !== undefined ? { caseId: result.caseId } : {}),
      ...(result.message !== undefined ? { message: result.message } : {}),
    });
  }

  return items;
}

/**
 * Build plan items for a scenario outline when outlineIs=section.
 * Creates:
 * 1. A section item for the outline itself
 * 2. If exampleIs=section: subsection items for each Examples table, then row cases within
 * 3. If exampleIs=case: row cases directly under the outline section
 */
async function buildOutlineSectionPlan(
  feature: ParsedFeature,
  outline: ScenarioOutlineNode,
  existingCases: readonly ExistingCase[],
  matchOpts: {
    duplicatePolicy: Parameters<typeof matchCase>[0]["duplicatePolicy"];
    interactive?: boolean;
    forcePrompt?: boolean;
    maxPromptCandidates?: number;
  },
  exampleIs: "case" | "section"
): Promise<PlanItem[]> {
  const items: PlanItem[] = [];

  // Compute the outline's signature (for linking)
  const outlineSignature = computeScenarioSignature({
    featurePath: feature.path,
    kind: "outline",
    title: outline.name,
    steps: outline.steps,
    backgroundSteps: outline.backgroundSteps,
    exampleTables: outline.examples.map((ex) => ({ headers: ex.headers, rowCount: ex.rows.length })),
  });

  // 1. Add section item for the outline itself
  items.push({
    featurePath: feature.path,
    nodeName: outline.name,
    kind: "outline",
    action: "create", // Sections are always created/matched by name
    signature: outlineSignature,
    itemType: "section",
  });

  // 2. Expand outline rows
  const rows = expandOutlineRows(outline);

  if (exampleIs === "section") {
    // Group rows by example index and create example subsections
    const rowsByExample = new Map<number, OutlineRowNode[]>();
    for (const row of rows) {
      const existing = rowsByExample.get(row.exampleIndex) ?? [];
      existing.push(row);
      rowsByExample.set(row.exampleIndex, existing);
    }

    for (const [exampleIndex, exampleRows] of rowsByExample) {
      // Create example subsection signature
      const exampleSignature = `${outlineSignature}:example:${exampleIndex}`;

      // Add section item for the Examples table
      items.push({
        featurePath: feature.path,
        nodeName: `Examples #${exampleIndex + 1}`,
        kind: "outline", // Best approximation
        action: "create",
        signature: exampleSignature,
        itemType: "section",
        parentSignature: outlineSignature,
        exampleIndex,
      });

      // Add row cases under this example section
      for (const row of exampleRows) {
        const rowItem = await buildRowCasePlanItem(feature, row, outlineSignature, exampleSignature, existingCases, matchOpts);
        items.push(rowItem);
      }
    }
  } else {
    // exampleIs=case: row cases directly under the outline section
    for (const row of rows) {
      const rowItem = await buildRowCasePlanItem(feature, row, outlineSignature, outlineSignature, existingCases, matchOpts);
      items.push(rowItem);
    }
  }

  return items;
}

/**
 * Build a plan item for a single outline row case.
 */
async function buildRowCasePlanItem(
  feature: ParsedFeature,
  row: OutlineRowNode,
  outlineSignature: string,
  parentSignature: string,
  existingCases: readonly ExistingCase[],
  _matchOpts: {
    duplicatePolicy: Parameters<typeof matchCase>[0]["duplicatePolicy"];
    interactive?: boolean;
    forcePrompt?: boolean;
    maxPromptCandidates?: number;
  }
): Promise<PlanItem> {
  // Compute row signature
  const rowSignature = computeRowSignature({
    featurePath: feature.path,
    outlineTitle: row.parentOutline.name,
    outlineSignature,
    exampleIndex: row.exampleIndex,
    rowIndex: row.rowIndex,
    rowValues: row.rowValues,
    steps: row.steps,
    backgroundSteps: row.backgroundSteps,
  });

  // Match against existing cases by signature
  const exactMatches = existingCases.filter((c) => c.signature === rowSignature);

  if (exactMatches.length === 1) {
    const match = exactMatches[0];
    if (match) {
      return {
        featurePath: feature.path,
        nodeName: `${row.name} [${row.rowIndex + 1}]`,
        kind: "outline-row",
        action: "use",
        signature: rowSignature,
        caseId: match.id,
        itemType: "case",
        parentSignature,
        exampleIndex: row.exampleIndex,
      };
    }
  }

  // TODO: Handle multiple matches via duplicate policy (similar to matchCase)
  // For now, create new if no exact match
  return {
    featurePath: feature.path,
    nodeName: `${row.name} [${row.rowIndex + 1}]`,
    kind: "outline-row",
    action: "create",
    signature: rowSignature,
    itemType: "case",
    parentSignature,
    exampleIndex: row.exampleIndex,
  };
}

export function formatDryRun(plan: readonly PlanItem[]): string[] {
  return plan.map((item) => {
    const base = `${item.featurePath} :: ${item.nodeName}`;
    const typeLabel = item.itemType === "section" ? "[section]" : "[case]";
    switch (item.action) {
      case "use":
        return `${base} ${typeLabel} -> reuse #${item.caseId} (${item.signature})`;
      case "create":
        return `${base} ${typeLabel} -> create new (${item.signature})`;
      case "skip":
        return `${base} ${typeLabel} -> skip (${item.signature})`;
      case "error":
        return `${base} ${typeLabel} -> error: ${item.message ?? "(unknown)"}`;
    }
  });
}

/**
 * More explicit, human-friendly messages suitable for CLI output.
 */
export function formatPlanVerbose(plan: readonly PlanItem[]): string[] {
  return plan.map((item) => {
    const context = `"${item.nodeName}" in ${item.featurePath}`;
    const isSection = item.itemType === "section";

    switch (item.action) {
      case "use":
        return isSection
          ? `Reuse existing section #${item.caseId} for ${context}`
          : `Reuse existing case #${item.caseId} for ${context} (signature ${item.signature})`;
      case "create":
        return isSection
          ? `Create new section for ${context}`
          : `Create new case for ${context} (signature ${item.signature})`;
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
