export type ScenarioStatus = "passed" | "failed" | "skipped" | "pending";

export interface ScenarioReport {
  readonly name: string;
  readonly fullName: string;
  readonly status: ScenarioStatus;
  readonly durationMs?: number;
  readonly error?: Error;
  readonly reason?: string;
}

export interface RuntimeSummary {
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly pending: number;
  readonly durationMs: number;
  readonly success: boolean;
  readonly scenarios: readonly ScenarioReport[];
}

export interface SummaryContext {
  readonly environment: string;
}

export type SummaryFormatter = (
  summary: RuntimeSummary,
  context: SummaryContext
) => string;
