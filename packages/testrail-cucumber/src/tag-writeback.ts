import type { ParsedFeature, FeatureChildNode, ScenarioOutlineNode } from "./types";
import { computeScenarioSignature, computeRowSignature } from "./signature";
import { expandOutlineRows } from "./parser";

export interface TagWritebackOptions {
  /** Tag prefix for case ids (default: "@testrail-case-" so case 123 => @testrail-case-123). */
  readonly caseTagPrefix?: string;
  /** Optional suite tag to apply at the feature level (e.g. @testrail-suite-42). */
  readonly suiteTag?: string;
  /** Optional section tag to apply at the feature level (e.g. @testrail-section-123). */
  readonly featureSectionTag?: string;
  /** Tag prefix for section ids (default: "@testrail-section-"). */
  readonly sectionTagPrefix?: string;
  /** Mapping from rule name to section id for writing rule section tags. */
  readonly ruleSectionIdsByName?: Readonly<Record<string, number>>;
  /** How to treat scenario outlines: "case" (default) or "section". */
  readonly outlineIs?: "case" | "section";
  /** When outlineIs=section, how to treat Examples: "case" (default) or "section". */
  readonly exampleIs?: "case" | "section";
  /** Where to place case tags for example rows: "above" (default) or "inline". */
  readonly exampleCaseTagPlacement?: "above" | "inline";
  /** Mapping from outline signature to section id (when outlineIs=section). */
  readonly outlineSectionIdsBySignature?: Readonly<Record<string, number>>;
  /** Mapping from example key (outlineSignature:exampleIndex) to section id (when exampleIs=section). */
  readonly exampleSectionIdsByKey?: Readonly<Record<string, number>>;
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
  const sectionTagPrefix = options.sectionTagPrefix ?? "@testrail-section-";
  const outlineIs = options.outlineIs ?? "case";
  const exampleIs = options.exampleIs ?? "case";

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

  // Track rules we've seen to write section tags
  const processedRules = new Set<string>();

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

    // Handle outlines differently when outlineIs=section
    if (node.kind === "outline" && outlineIs === "section") {
      // Tag the outline with section ID instead of case ID
      const outlineSectionId = options.outlineSectionIdsBySignature?.[signature];
      if (outlineSectionId !== undefined) {
        const idx = line - 1;
        if (idx >= 0 && idx < lines.length) {
          const missing = applyTagsAtLine(lines, idx, [`${sectionTagPrefix}${outlineSectionId}`]);
          if (missing.length > 0) {
            applied.push({ nodeName: `Outline: ${node.name}`, addedTags: missing });
          }
        }
      }

      // Write row tags and example section tags
      const rowApplied = applyOutlineRowTags(
        lines,
        feature,
        node,
        signature,
        caseIdBySignature,
        options,
        caseTagPrefix,
        sectionTagPrefix,
        exampleIs
      );
      applied.push(...rowApplied);
      continue;
    }

    // Standard case handling for scenarios and outlines (when outlineIs=case)
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

  // Write rule section tags
  if (options.ruleSectionIdsByName) {
    for (const { node, line } of nodesWithLine) {
      const ruleName = node.rule?.name;
      if (!ruleName || processedRules.has(ruleName)) {
        continue;
      }

      const sectionId = options.ruleSectionIdsByName[ruleName];
      if (sectionId === undefined) {
        continue;
      }

      processedRules.add(ruleName);

      // Find the rule line by searching backwards from the node line
      const ruleLineIndex = findRuleLineIndex(lines, line - 1, ruleName);
      if (ruleLineIndex !== undefined) {
        const missing = applyTagsAtLine(lines, ruleLineIndex, [`${sectionTagPrefix}${sectionId}`]);
        if (missing.length > 0) {
          applied.push({ nodeName: `Rule: ${ruleName}`, addedTags: missing });
        }
      }
    }
  }

  // Write feature-level tags (suite and section)
  const featureLineIndex = findFeatureLineIndex(lines);
  if (featureLineIndex !== undefined) {
    const featureTags: string[] = [];
    if (options.suiteTag) {
      featureTags.push(options.suiteTag);
    }
    if (options.featureSectionTag) {
      featureTags.push(options.featureSectionTag);
    }

    if (featureTags.length > 0) {
      const missing = applyTagsAtLine(lines, featureLineIndex, featureTags);
      if (missing.length > 0) {
        applied.push({ nodeName: `Feature: ${feature.name}`, addedTags: missing });
      }
    }
  }

  const updatedText = lines.join("\n");
  return { updatedText, changed: updatedText !== originalText, applied };
}

/**
 * Apply tags for outline rows when outlineIs=section.
 * 
 * Tag placement depends on exampleIs and exampleCaseTagPlacement:
 * - exampleIs=case: All row case tags go above the Scenario Outline line
 * - exampleIs=section + placement=above: Row case tags go above each Examples line
 * - exampleIs=section + placement=inline: Row case tags in a new table column with proper | delimiters
 */
function applyOutlineRowTags(
  lines: string[],
  feature: ParsedFeature,
  outline: ScenarioOutlineNode,
  outlineSignature: string,
  caseIdBySignature: Readonly<Record<string, number>>,
  options: TagWritebackOptions,
  caseTagPrefix: string,
  sectionTagPrefix: string,
  exampleIs: "case" | "section"
): { nodeName: string; addedTags: string[] }[] {
  const applied: { nodeName: string; addedTags: string[] }[] = [];
  const exampleCaseTagPlacement = options.exampleCaseTagPlacement ?? "above";

  // Expand outline rows to get signatures (in order)
  const rows = expandOutlineRows(outline);

  if (exampleIs === "case") {
    // All row case tags go above the Scenario Outline line
    const outlineLine = outline.line;
    if (typeof outlineLine !== "number" || outlineLine < 1) return applied;

    const tagsToAdd: string[] = [];
    for (const row of rows) {
      const rowSignature = computeRowSignature({
        featurePath: feature.path,
        outlineTitle: outline.name,
        outlineSignature,
        exampleIndex: row.exampleIndex,
        rowIndex: row.rowIndex,
        rowValues: row.rowValues,
        steps: row.steps,
        backgroundSteps: row.backgroundSteps,
      });

      const caseId = caseIdBySignature[rowSignature];
      if (caseId !== undefined) {
        tagsToAdd.push(`${caseTagPrefix}${caseId}`);
      }
    }

    if (tagsToAdd.length > 0) {
      const idx = outlineLine - 1;
      if (idx >= 0 && idx < lines.length) {
        const missing = applyTagsAtLine(lines, idx, tagsToAdd);
        if (missing.length > 0) {
          applied.push({ nodeName: `Outline: ${outline.name}`, addedTags: missing });
        }
      }
    }

    return applied;
  }

  // exampleIs=section: Write section tags on Examples, case tags depend on placement
  const examplesLineIndices = findExamplesLineIndices(lines, outline);

  // Group rows by example index
  const rowsByExample = new Map<number, typeof rows>();
  for (const row of rows) {
    const existing = rowsByExample.get(row.exampleIndex) ?? [];
    existing.push(row);
    rowsByExample.set(row.exampleIndex, existing);
  }

  // Track cumulative line offset from insertions
  let lineOffset = 0;

  // Process each Examples table
  for (const [exampleIndex, exampleRows] of rowsByExample) {
    const exampleLineInfo = examplesLineIndices[exampleIndex];
    if (!exampleLineInfo) continue;

    // Adjust indices by current offset
    const adjustedExamplesLineIndex = exampleLineInfo.examplesLineIndex + lineOffset;
    let adjustedHeaderLineIndex = exampleLineInfo.headerLineIndex + lineOffset;

    // Collect case tags for this example's rows
    const rowCaseTags: { rowIndex: number; tag: string; name: string }[] = [];
    for (const row of exampleRows) {
      const rowSignature = computeRowSignature({
        featurePath: feature.path,
        outlineTitle: outline.name,
        outlineSignature,
        exampleIndex: row.exampleIndex,
        rowIndex: row.rowIndex,
        rowValues: row.rowValues,
        steps: row.steps,
        backgroundSteps: row.backgroundSteps,
      });

      const caseId = caseIdBySignature[rowSignature];
      if (caseId !== undefined) {
        rowCaseTags.push({
          rowIndex: row.rowIndex,
          tag: `${caseTagPrefix}${caseId}`,
          name: row.name,
        });
      }
    }

    // Write example section tag (may insert a line)
    const linesBefore = lines.length;
    if (options.exampleSectionIdsByKey) {
      const exampleKey = `${outlineSignature}:example:${exampleIndex}`;
      const exampleSectionId = options.exampleSectionIdsByKey[exampleKey];
      if (exampleSectionId !== undefined) {
        const missing = applyTagsAtLine(lines, adjustedExamplesLineIndex, [`${sectionTagPrefix}${exampleSectionId}`]);
        if (missing.length > 0) {
          applied.push({ nodeName: `Examples #${exampleIndex + 1}`, addedTags: missing });
        }
      }
    }
    // Track if a line was inserted
    const linesInserted = lines.length - linesBefore;
    adjustedHeaderLineIndex += linesInserted;
    lineOffset += linesInserted;

    if (rowCaseTags.length === 0) continue;

    if (exampleCaseTagPlacement === "above") {
      // Write all row case tags above the Examples line (may insert a line)
      const tagsToAdd = rowCaseTags.map((r) => r.tag);
      const linesBeforeTags = lines.length;
      const missing = applyTagsAtLine(lines, adjustedExamplesLineIndex, tagsToAdd);
      if (missing.length > 0) {
        applied.push({ nodeName: `Examples #${exampleIndex + 1} rows`, addedTags: missing });
      }
      lineOffset += lines.length - linesBeforeTags;
    } else {
      // placement=inline: Add or update a "testrail case" column in the table
      const headerLine = lines[adjustedHeaderLineIndex];
      if (typeof headerLine !== "string") continue;

      // Check if we already have a testrail case column
      const headerColumnName = "testrail case";
      const hasColumn = headerLine.toLowerCase().includes(headerColumnName);

      // Find the column index if it exists
      let testrailColumnIndex = -1;
      if (hasColumn) {
        const headerCells = parseTableRow(headerLine);
        testrailColumnIndex = headerCells.findIndex(
          (cell) => cell.toLowerCase().trim() === headerColumnName
        );
      }

      if (!hasColumn) {
        // Add column header to the table header row
        const trimmedHeader = headerLine.trimEnd();
        const headerEndsWithPipe = trimmedHeader.endsWith("|");
        lines[adjustedHeaderLineIndex] = headerEndsWithPipe
          ? `${trimmedHeader} ${headerColumnName} |`
          : `${trimmedHeader} | ${headerColumnName} |`;
      }

      // Add or update case tags in each data row
      for (const { rowIndex, tag, name } of rowCaseTags) {
        const dataRowLineIndex = adjustedHeaderLineIndex + 1 + rowIndex;
        if (dataRowLineIndex >= lines.length) continue;

        const rowLine = lines[dataRowLineIndex];
        if (typeof rowLine !== "string" || !rowLine.trim().startsWith("|")) continue;

        // Check if this exact tag already present
        if (rowLine.includes(tag)) continue;

        if (hasColumn && testrailColumnIndex >= 0) {
          // Update existing column value
          const indent = (rowLine.match(/^\s*/) ?? [""])[0];
          const cells = parseTableRow(rowLine);
          if (testrailColumnIndex < cells.length) {
            const existingValue = cells[testrailColumnIndex]?.trim() ?? "";
            // If there's already a testrail-case tag here, skip (different case ID = different row)
            if (existingValue.includes("@testrail-case-")) continue;
            cells[testrailColumnIndex] = tag;
            lines[dataRowLineIndex] = indent + formatTableRow(cells);
            applied.push({ nodeName: `Row ${rowIndex + 1}: ${name}`, addedTags: [tag] });
          }
        } else {
          // Add new column value
          const trimmedRow = rowLine.trimEnd();
          const rowEndsWithPipe = trimmedRow.endsWith("|");
          lines[dataRowLineIndex] = rowEndsWithPipe
            ? `${trimmedRow} ${tag} |`
            : `${trimmedRow} | ${tag} |`;
          applied.push({ nodeName: `Row ${rowIndex + 1}: ${name}`, addedTags: [tag] });
        }
      }
    }
  }

  return applied;
}

/**
 * Find the line indices for Examples tables in an outline.
 * Returns array of { examplesLineIndex, headerLineIndex } for each Examples table.
 */
function findExamplesLineIndices(
  lines: readonly string[],
  outline: ScenarioOutlineNode
): { examplesLineIndex: number; headerLineIndex: number }[] {
  const results: { examplesLineIndex: number; headerLineIndex: number }[] = [];

  // Find the outline's line first
  const outlineLine = (outline as unknown as { line?: number }).line;
  if (typeof outlineLine !== "number") return results;

  let inOutline = false;

  for (let i = outlineLine - 1; i < lines.length; i++) {
    const line = lines[i];
    if (typeof line !== "string") continue;
    const trimmed = line.trimStart();

    // Track when we enter the outline
    if (trimmed.startsWith("Scenario Outline:") || trimmed.startsWith("Scenario Template:")) {
      inOutline = true;
      continue;
    }

    // Exit if we hit another scenario or rule
    if (inOutline && (trimmed.startsWith("Scenario:") || trimmed.startsWith("Scenario Outline:") ||
        trimmed.startsWith("Scenario Template:") || trimmed.startsWith("Rule:") ||
        trimmed.startsWith("Feature:"))) {
      break;
    }

    // Found an Examples table
    if (inOutline && (trimmed.startsWith("Examples:") || trimmed.startsWith("Scenarios:"))) {
      // Find the header line (first line starting with |)
      let headerLineIndex = -1;
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j];
        if (typeof nextLine !== "string") continue;
        const nextTrimmed = nextLine.trimStart();
        if (nextTrimmed.startsWith("|")) {
          headerLineIndex = j;
          break;
        }
        if (nextTrimmed.startsWith("@")) continue; // Skip tags
        if (nextTrimmed && !nextTrimmed.startsWith("#")) break; // Non-empty, non-comment line
      }

      if (headerLineIndex !== -1) {
        results.push({ examplesLineIndex: i, headerLineIndex });
      }
    }
  }

  return results;
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

function findRuleLineIndex(lines: readonly string[], startIndex: number, ruleName: string): number | undefined {
  // Search backwards from the scenario line to find the Rule: line
  for (let i = startIndex; i >= 0; i--) {
    const line = lines[i];
    if (typeof line === "string") {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("Rule:") && trimmed.includes(ruleName)) {
        return i;
      }
      // Stop if we hit a feature or another rule
      if (trimmed.startsWith("Feature:")) {
        break;
      }
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

/**
 * Parse a Gherkin table row into cell values.
 * Input: "| value1 | value2 | value3 |"
 * Output: ["value1", "value2", "value3"]
 */
function parseTableRow(row: string): string[] {
  // Split by pipe, trim each cell, filter out empty start/end from leading/trailing pipes
  const parts = row.split("|");
  // Remove first and last empty elements from the split (from leading/trailing |)
  if (parts.length > 0 && parts[0]?.trim() === "") {
    parts.shift();
  }
  if (parts.length > 0 && parts[parts.length - 1]?.trim() === "") {
    parts.pop();
  }
  return parts.map((p) => p.trim());
}

/**
 * Format cell values back into a Gherkin table row.
 * Input: ["value1", "value2", "value3"]
 * Output: "| value1 | value2 | value3 |"
 */
function formatTableRow(cells: string[]): string {
  return "| " + cells.join(" | ") + " |";
}
