import { createHash } from "node:crypto";

export type NodeKind = "scenario" | "outline";

export interface StepShape {
  readonly keyword: string;
  readonly text: string;
  readonly table?: {
    readonly headers: readonly string[];
    readonly rows: readonly (readonly string[])[];
  };
}

export interface ExampleTableShape {
  readonly headers: readonly string[];
  readonly rowCount: number;
}

export interface SignatureInput {
  /** Repo-relative feature path, normalized to forward slashes. */
  readonly featurePath: string;
  readonly kind: NodeKind;
  readonly title: string;
  readonly steps: readonly StepShape[];
  /** Background steps that effectively prepend to the scenario. */
  readonly backgroundSteps?: readonly StepShape[];
  /** Shape of examples for outlines (headers + rowCount only). */
  readonly exampleTables?: readonly ExampleTableShape[];
}

/**
 * Compute a stable signature used to identify a scenario/outline across uploads.
 * - Ignores example values, only uses example shape (headers + rowCount).
 * - Includes background steps to reflect what actually runs.
 */
export function computeScenarioSignature(input: SignatureInput): string {
  const normalizedPath = normalizePath(input.featurePath);
  const canonical = {
    featurePath: normalizedPath,
    kind: input.kind,
    title: normalizeText(input.title),
    steps: normalizeSteps(input.steps),
    backgroundSteps: normalizeSteps(input.backgroundSteps ?? []),
    exampleTables: (input.exampleTables ?? []).map((tbl) => ({
      headers: tbl.headers.map(normalizeText),
      rowCount: tbl.rowCount,
    })),
  } as const;

  const json = JSON.stringify(canonical);
  const hash = createHash("sha256").update(json, "utf8").digest("hex");
  // Prefix to make it recognizable in refs/custom fields
  return `autometa:${hash}`;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizePath(value: string): string {
  return value.trim().replace(/\\/g, "/").toLowerCase();
}

function normalizeSteps(steps: readonly StepShape[]): readonly unknown[] {
  return steps.map((step) => ({
    keyword: step.keyword.trim().toLowerCase(),
    text: normalizeText(step.text),
    table: step.table
      ? {
          headers: step.table.headers.map(normalizeText),
          // Only keep shape, not values, for stability and privacy
          rowCount: step.table.rows.length,
        }
      : undefined,
  }));
}
