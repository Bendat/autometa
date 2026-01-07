import type { StepRuntimeHelpers } from "@autometa/executor";
import type { HTTPResponse } from "@autometa/http";
import type { SimpleFeature } from "@autometa/gherkin";
import { WORLD_INHERIT_KEYS } from "@autometa/runner";

const DEFAULT_API_BASE_URL = "http://localhost:4000";

export type StepLifecycleStatus = "passed" | "failed" | "skipped";

export interface LifecycleStepRecord {
  readonly scenario: string;
  readonly step: string;
  readonly status: StepLifecycleStatus;
}

export interface LifecycleMetrics {
  featureName?: string;
  beforeFeatureRuns: number;
  afterFeatureRuns: number;
  scenarioOrder: string[];
  stepHistory: LifecycleStepRecord[];
}

export interface ScenarioState {
  apiBaseUrl?: string;
}

export interface RunnerCompositionWorldBase {
  baseUrl: string;
  readonly scenario: ScenarioState;
  readonly lifecycle: LifecycleMetrics;
  readonly features: SimpleFeature[];
  readonly runtime: StepRuntimeHelpers;
}

export type RunnerCompositionWorld = RunnerCompositionWorldBase & {
  readonly app: {
    lastResponse?: HTTPResponse<unknown>;
    lastResponseBody?: unknown;
    lastResponseHeaders?: Record<string, string>;
    lastError?: unknown;
    request(method: string, path: string, options?: unknown): Promise<HTTPResponse<unknown>>;
    perform(method: string, path: string, options?: unknown): Promise<void>;
    extractErrorStatus(): number | undefined;
  };
};

function createScenarioState(): ScenarioState {
  return {} satisfies ScenarioState;
}

function createLifecycleMetrics(): LifecycleMetrics {
  return {
    beforeFeatureRuns: 0,
    afterFeatureRuns: 0,
    scenarioOrder: [],
    stepHistory: [],
  } satisfies LifecycleMetrics;
}

export const runnerCompositionWorldDefaults = {
  baseUrl: process.env.BREW_BUDDY_BASE_URL ?? DEFAULT_API_BASE_URL,
  scenario: createScenarioState(),
  lifecycle: createLifecycleMetrics(),
  features: [] as SimpleFeature[],

  // Share lifecycle metrics across nested scopes (feature -> scenario) so that
  // feature hooks can record data that step definitions can later assert on.
  [WORLD_INHERIT_KEYS]: ["lifecycle"],
} satisfies Omit<RunnerCompositionWorldBase, "runtime">;
