import type {
  ScopeExecutionAdapter,
  ScopeNode,
  ScenarioSummary,
  StepDefinition,
  ExecutionMode,
  TimeoutSpec,
} from "@autometa/scopes";
import type {
  SimpleCompiledScenario,
  SimpleExampleGroup,
  SimpleFeature,
  SimpleRule,
  SimpleScenario,
  SimpleScenarioOutline,
  SimpleStep,
} from "@autometa/gherkin";

/**
 * Status values tracked for each executable scenario row within a feature.
 */
export type ScenarioStatus = "pending" | "passed" | "failed" | "skipped";

/**
 * Runtime result metadata captured for a scenario or example execution.
 */
export interface ScenarioResult {
  readonly status: ScenarioStatus;
  readonly error?: Error;
  readonly reason?: string;
  readonly startedAt?: number;
  readonly completedAt?: number;
}

/**
 * Shared metadata for the fully qualified Gherkin location of a node.
 */
export interface QualifiedPathSegment {
  readonly keyword: string;
  readonly name?: string;
  readonly suffix?: string;
}

export interface ScenarioExecution<World> {
  readonly id: string;
  readonly type: "scenario" | "example";
  readonly name: string;
  readonly keyword: string;
  readonly qualifiedName: string;
  readonly tags: readonly string[];
  readonly mode: ExecutionMode;
  readonly pending: boolean;
  readonly pendingReason?: string;
  readonly timeout?: TimeoutSpec;
  readonly data?: Record<string, unknown>;
  readonly feature: FeatureNode<World>;
  readonly rule?: RuleNode<World>;
  readonly outline?: ScenarioOutlineNode<World>;
  readonly scope: ScopeNode<World>;
  readonly summary: ScenarioSummary<World>;
  readonly gherkin: SimpleScenario | SimpleCompiledScenario;
  readonly gherkinSteps: readonly SimpleStep[];
  readonly steps: readonly StepDefinition<World>[];
  readonly ancestors: readonly ScopeNode<World>[];
  readonly result: ScenarioResult;
  markPassed(): void;
  markFailed(error: unknown): void;
  markSkipped(reason?: string): void;
  markPending(reason?: string): void;
  reset(): void;
}

export interface ScenarioOutlineExample<World> extends ScenarioExecution<World> {
  readonly outline: ScenarioOutlineNode<World>;
  readonly exampleGroup: SimpleExampleGroup;
  readonly compiled: SimpleCompiledScenario;
  readonly exampleIndex: number;
}

export interface ScenarioNode<World> extends ScenarioExecution<World> {
  readonly gherkin: SimpleScenario;
}

export interface ScenarioOutlineNode<World> {
  readonly type: "scenarioOutline";
  readonly name: string;
  readonly keyword: string;
  readonly qualifiedName: string;
  readonly outline: SimpleScenarioOutline;
  readonly scope: ScopeNode<World>;
  readonly summary: ScenarioSummary<World>;
  readonly tags: readonly string[];
  readonly mode: ExecutionMode;
  readonly pending: boolean;
  readonly pendingReason?: string;
  readonly timeout?: TimeoutSpec;
  readonly data?: Record<string, unknown>;
  readonly ancestors: readonly ScopeNode<World>[];
  readonly examples: readonly ScenarioOutlineExample<World>[];
}

export interface RuleNode<World> {
  readonly type: "rule";
  readonly name: string;
  readonly keyword: string;
  readonly qualifiedName: string;
  readonly rule: SimpleRule;
  readonly scope: ScopeNode<World>;
  readonly scenarios: readonly ScenarioNode<World>[];
  readonly scenarioOutlines: readonly ScenarioOutlineNode<World>[];
  readonly background?: SimpleScenario;
}

export interface FeatureNode<World> {
  readonly type: "feature";
  readonly name: string;
  readonly keyword: string;
  readonly feature: SimpleFeature;
  readonly scope: ScopeNode<World>;
  readonly scenarios: readonly ScenarioNode<World>[];
  readonly scenarioOutlines: readonly ScenarioOutlineNode<World>[];
  readonly rules: readonly RuleNode<World>[];
  readonly background?: SimpleScenario;
  listExecutables(): readonly ScenarioExecution<World>[];
}

export interface TestPlan<World> {
  readonly feature: FeatureNode<World>;
  listExecutables(): readonly ScenarioExecution<World>[];
  listFailed(): readonly ScenarioExecution<World>[];
  findById(id: string): ScenarioExecution<World> | undefined;
  findByQualifiedName(name: string): ScenarioExecution<World> | undefined;
}

export interface BuildTestPlanOptions<World> {
  readonly feature: SimpleFeature;
  readonly adapter: ScopeExecutionAdapter<World>;
  readonly featureScope?: ScopeNode<World>;
}
