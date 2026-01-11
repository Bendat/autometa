import type { ParsedFeature, FeatureChildNode } from "./types";
import { computeScenarioSignature } from "./signature";

export interface TagWritebackOptions {
  /** Tag prefix for case ids (default: "@C" so case 123 => @C123). */
  readonly caseTagPrefix?: string;
  /** Optional suite tag to apply (e.g. @testrail-suite-42). */
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
  const caseTagPrefix = options.caseTagPrefix ?? "@C";

  const lines = originalText.split(/\r?\n/);
  const applied: { nodeName: string; addedTags: string[] }[] = [];

  const nodesWithLine = feature.children
    .map((n) => ({ node: n, line: (n as any).line as number | undefined }))
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
    if (resolvedId === undefined && !options.suiteTag) {
      continue;
    }

    const tagsToAdd: string[] = [];
    if (resolvedId !== undefined) {
      tagsToAdd.push(`${caseTagPrefix}${resolvedId}`);
    }
    if (options.suiteTag) {
      tagsToAdd.push(options.suiteTag);
    }

    const idx = line - 1; // 1-based to 0-based
    if (idx < 0 || idx >= lines.length) continue;

    const scenarioLine = lines[idx] ?? "";
    const indent = (scenarioLine.match(/^\s*/) ?? [""])[0];

    const existingTagLines = collectTagLinesAbove(lines, idx);
    const existingTags = new Set(extractTags(existingTagLines));

    const missing = tagsToAdd.filter((t) => !existingTags.has(t));
    if (missing.length === 0) continue;

    if (existingTagLines.length > 0) {
      // Append to the last tag line for this scenario.
      const lastTagLineIndex = idx - 1;
      const newLine = lines[lastTagLineIndex]!.trimEnd() + " " + missing.join(" ");
      lines[lastTagLineIndex] = newLine;
    } else {
      lines.splice(idx, 0, indent + missing.join(" "));
    }

    applied.push({ nodeName: node.name, addedTags: missing });
  }

  const updatedText = lines.join("\n");
  return { updatedText, changed: updatedText !== originalText, applied };
}

function collectTagLinesAbove(lines: string[], scenarioLineIndex: number): string[] {
  const tagLines: string[] = [];
  // Only consider contiguous tag lines immediately above the scenario.
  for (let i = scenarioLineIndex - 1; i >= 0; i--) {
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
