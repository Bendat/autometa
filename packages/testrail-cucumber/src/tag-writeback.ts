import type { ParsedFeature, FeatureChildNode } from "./types";
import { computeScenarioSignature } from "./signature";

export interface TagWritebackOptions {
  /** Tag prefix for case ids (default: "@testrail-case-" so case 123 => @testrail-case-123). */
  readonly caseTagPrefix?: string;
  /** Optional suite tag to apply at the feature level (e.g. @testrail-suite-42). */
  readonly suiteTag?: string;
}

export interface TagWritebackResult {
  readonly updatedText: string;
  readonly changed: boolean;
  readonly applied: readonly { readonly nodeName: string; readonly addedTags: readonly string[] }[];
}

export function applyCaseTagsToFeatureText(
  originalText: string,
  feature: ParsedFeature,
  caseIdBySignature: Readonly<Record<string, number>>,
  options: TagWritebackOptions = {}
): TagWritebackResult {
  const caseTagPrefix = options.caseTagPrefix ?? "@testrail-case-";

  const lines = originalText.split(/\r?\n/);
  const applied: { nodeName: string; addedTags: string[] }[] = [];

  const nodeLine = (node: FeatureChildNode): number | undefined => {
    const line = (node as unknown as { line?: unknown }).line;
    return typeof line === "number" ? line : undefined;
  };

  const nodesWithLine = feature.children
    .map((n) => ({ node: n, line: nodeLine(n) }))
    .filter((x): x is { node: FeatureChildNode; line: number } => typeof x.line === "number" && x.line > 0)
    .sort((a, b) => b.line - a.line);

  for (const { node, line } of nodesWithLine) {
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

    const resolvedId = caseIdBySignature[signature];
    if (resolvedId === undefined) {
      continue;
    }

    const tagsToAdd = [`${caseTagPrefix}${resolvedId}`];

    const idx = line - 1; // 1-based to 0-based
    if (idx < 0 || idx >= lines.length) continue;

    const missing = applyTagsAtLine(lines, idx, tagsToAdd);
    if (missing.length === 0) continue;

    applied.push({ nodeName: node.name, addedTags: missing });
  }

  if (options.suiteTag) {
    const featureLineIndex = findFeatureLineIndex(lines);
    if (featureLineIndex !== undefined) {
      const missing = applyTagsAtLine(lines, featureLineIndex, [options.suiteTag]);
      if (missing.length > 0) {
        applied.push({ nodeName: `Feature: ${feature.name}`, addedTags: missing });
      }
    }
  }

  const updatedText = lines.join("\n");
  return { updatedText, changed: updatedText !== originalText, applied };
}

function findFeatureLineIndex(lines: readonly string[]): number | undefined {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (typeof line === "string" && line.trimStart().startsWith("Feature:")) {
      return i;
    }
  }
  return undefined;
}

function applyTagsAtLine(lines: string[], targetLineIndex: number, tags: readonly string[]): string[] {
  const targetLine = lines[targetLineIndex] ?? "";
  const indent = (targetLine.match(/^\s*/) ?? [""])[0];

  const existingTagLines = collectTagLinesAbove(lines, targetLineIndex);
  const existingTags = new Set(extractTags(existingTagLines));
  const missing = tags.filter((t) => !existingTags.has(t));
  if (missing.length === 0) {
    return [];
  }

  if (existingTagLines.length > 0) {
    const lastTagLineIndex = targetLineIndex - 1;
    const lastTagLine = lines[lastTagLineIndex];
    if (typeof lastTagLine !== "string") {
      return [];
    }
    lines[lastTagLineIndex] = lastTagLine.trimEnd() + " " + missing.join(" ");
    return [...missing];
  }

  lines.splice(targetLineIndex, 0, indent + missing.join(" "));
  return [...missing];
}

function collectTagLinesAbove(lines: string[], targetLineIndex: number): string[] {
  const tagLines: string[] = [];
  // Only consider contiguous tag lines immediately above the target line.
  for (let i = targetLineIndex - 1; i >= 0; i--) {
    const line = lines[i] ?? "";
    if (line.trim().startsWith("@")) {
      tagLines.unshift(line);
      continue;
    }
    break;
  }
  return tagLines;
}

function extractTags(lines: readonly string[]): string[] {
  const tags: string[] = [];
  for (const line of lines) {
    for (const token of line.trim().split(/\s+/)) {
      if (token.startsWith("@")) tags.push(token);
    }
  }
  return tags;
}

// (no helper needed; we compute signature directly above)
