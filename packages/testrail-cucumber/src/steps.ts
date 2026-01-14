import type { StepNode } from "./types";

/**
 * Render a Gherkin data table to the wiki-ish format used by the legacy tool.
 * This keeps it human-readable inside TestRail step content.
 */
export function renderStepTable(table?: StepNode["table"]): string {
  if (!table) return "";
  if (table.headers.length === 0) return "";

  const headers = "|||" + table.headers.map((h) => `: ${h}`).join("|");
  const rowsText = table.rows.map((row) => "||" + row.join("|")).join("\n");
  return `${headers}\n${rowsText}`;
}

export function toSeparatedSteps(steps: readonly StepNode[]): readonly { readonly content: string }[] {
  return steps.map((step) => {
    const tableText = renderStepTable(step.table);
    const content = tableText
      ? `${step.keyword} ${step.text}\n${tableText}`
      : `${step.keyword} ${step.text}`;
    return { content };
  });
}
