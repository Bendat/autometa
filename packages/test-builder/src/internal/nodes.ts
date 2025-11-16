import type {
  ExecutionMode,
  ScopeNode,
  ScenarioSummary,
  StepDefinition,
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
import type {
  FeatureNode,
  RuleNode,
  ScenarioExecution,
  ScenarioNode,
  ScenarioOutlineExample,
  ScenarioOutlineNode,
  ScenarioResult,
} from "../types";
import {
  cloneData,
  normalizeError,
  normalizeKeyword,
} from "./utils";

export interface FeatureNodeInit<World> {
  readonly feature: SimpleFeature;
  readonly scope: ScopeNode<World>;
  readonly executions: ScenarioExecution<World>[];
  readonly scenarios: ScenarioNode<World>[];
  readonly outlines: ScenarioOutlineNode<World>[];
  readonly rules: RuleNode<World>[];
}

export interface RuleNodeInit<World> {
  readonly rule: SimpleRule;
  readonly scope: ScopeNode<World>;
  readonly qualifiedName: string;
  readonly scenarios: ScenarioNode<World>[];
  readonly outlines: ScenarioOutlineNode<World>[];
}

export interface ScenarioExecutionInit<World, Gherkin extends SimpleScenario | SimpleCompiledScenario> {
  readonly id: string;
  readonly feature: FeatureNode<World>;
  readonly rule?: RuleNode<World>;
  readonly outline?: ScenarioOutlineNode<World>;
  readonly name: string;
  readonly keyword: string;
  readonly qualifiedName: string;
  readonly tags: readonly string[];
  readonly mode: ExecutionMode;
  readonly pending: boolean;
  readonly pendingReason?: string;
  readonly timeout?: TimeoutSpec;
  readonly data?: Record<string, unknown>;
  readonly scope: ScopeNode<World>;
  readonly summary: ScenarioSummary<World>;
  readonly gherkin: Gherkin;
  readonly gherkinSteps: readonly SimpleStep[];
  readonly steps: readonly StepDefinition<World>[];
  readonly ancestors: readonly ScopeNode<World>[];
  readonly exampleGroup?: SimpleExampleGroup;
  readonly exampleIndex?: number;
}

export interface ScenarioOutlineExampleInit<World>
  extends ScenarioExecutionInit<World, SimpleCompiledScenario> {
  readonly outline: ScenarioOutlineNode<World>;
  readonly exampleGroup: SimpleExampleGroup;
  readonly exampleIndex: number;
}

export interface ScenarioOutlineNodeInit<World> {
  readonly outline: SimpleScenarioOutline;
  readonly summary: ScenarioSummary<World>;
  readonly scope: ScopeNode<World>;
  readonly keyword: string;
  readonly name: string;
  readonly qualifiedName: string;
  readonly tags: readonly string[];
  readonly mode: ExecutionMode;
  readonly pending: boolean;
  readonly pendingReason?: string;
  readonly timeout?: TimeoutSpec;
  readonly data?: Record<string, unknown>;
  readonly ancestors: readonly ScopeNode<World>[];
  readonly rule?: RuleNode<World>;
  readonly feature: FeatureNode<World>;
  readonly examples: ScenarioOutlineExample<World>[];
}

export function createFeatureNode<World>(init: FeatureNodeInit<World>): FeatureNode<World> {
  return new FeatureNodeImpl(init);
}

export function createRuleNode<World>(init: RuleNodeInit<World>): RuleNode<World> {
  return new RuleNodeImpl(init);
}

export function createScenarioNode<World>(
  init: ScenarioExecutionInit<World, SimpleScenario>
): ScenarioNode<World> {
  return new ScenarioNodeImpl(init);
}

export function createScenarioOutlineNode<World>(
  init: ScenarioOutlineNodeInit<World>
): ScenarioOutlineNode<World> {
  return new ScenarioOutlineNodeImpl(init);
}

export function createScenarioOutlineExample<World>(
  init: ScenarioOutlineExampleInit<World>
): ScenarioOutlineExample<World> {
  return new ScenarioOutlineExampleImpl(init);
}

class FeatureNodeImpl<World> implements FeatureNode<World> {
  readonly type = "feature" as const;
  readonly scenarios: ScenarioNode<World>[];
  readonly scenarioOutlines: ScenarioOutlineNode<World>[];
  readonly rules: RuleNode<World>[];
  readonly name: string;
  readonly keyword: string;
  readonly background?: SimpleScenario;
  readonly feature: SimpleFeature;
  readonly scope: ScopeNode<World>;
  private readonly executions: ScenarioExecution<World>[];

  constructor(init: FeatureNodeInit<World>) {
    this.feature = init.feature;
    this.scope = init.scope;
    this.executions = init.executions;
    this.scenarios = init.scenarios;
    this.scenarioOutlines = init.outlines;
    this.rules = init.rules;
    this.name = init.feature.name;
    this.keyword = normalizeKeyword(init.feature.keyword ?? "Feature");
    if (init.feature.background) {
      this.background = init.feature.background;
    }
  }

  listExecutables(): readonly ScenarioExecution<World>[] {
    return this.executions;
  }
}

class RuleNodeImpl<World> implements RuleNode<World> {
  readonly type = "rule" as const;
  readonly scenarios: readonly ScenarioNode<World>[];
  readonly scenarioOutlines: readonly ScenarioOutlineNode<World>[];
  readonly name: string;
  readonly keyword: string;
  readonly background?: SimpleScenario;
  readonly rule: SimpleRule;
  readonly scope: ScopeNode<World>;
  readonly qualifiedName: string;

  constructor(init: RuleNodeInit<World>) {
    this.rule = init.rule;
    this.scope = init.scope;
    this.qualifiedName = init.qualifiedName;
    this.name = init.rule.name;
    this.keyword = normalizeKeyword(init.rule.keyword ?? "Rule");
    if (init.rule.background) {
      this.background = init.rule.background;
    }
    this.scenarios = init.scenarios;
    this.scenarioOutlines = init.outlines;
  }
}

abstract class ScenarioExecutionBase<World, Gherkin extends SimpleScenario | SimpleCompiledScenario>
  implements ScenarioExecution<World>
{
  readonly type: "scenario" | "example";
  readonly id: string;
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
  readonly gherkin: Gherkin;
  readonly gherkinSteps: readonly SimpleStep[];
  readonly steps: readonly StepDefinition<World>[];
  readonly ancestors: readonly ScopeNode<World>[];

  private resultState: ScenarioResult = { status: "pending" };

  protected constructor(
    type: "scenario" | "example",
    init: ScenarioExecutionInit<World, Gherkin>
  ) {
    this.type = type;
    this.id = init.id;
    this.name = init.name;
    this.keyword = normalizeKeyword(init.keyword);
    this.qualifiedName = init.qualifiedName;
    this.tags = [...init.tags];
    this.mode = init.mode;
    this.pending = init.pending;
    if (init.pendingReason !== undefined) {
      this.pendingReason = init.pendingReason;
    }
    if (init.timeout !== undefined) {
      this.timeout = init.timeout;
    }
    const data = cloneData(init.data);
    if (data !== undefined) {
      this.data = data;
    }
    this.feature = init.feature;
    if (init.rule) {
      this.rule = init.rule;
    }
    if (init.outline) {
      this.outline = init.outline;
    }
    this.scope = init.scope;
    this.summary = init.summary;
    this.gherkin = init.gherkin;
    this.gherkinSteps = [...init.gherkinSteps];
    this.steps = [...init.steps];
    this.ancestors = [...init.ancestors];
  }

  get result(): ScenarioResult {
    return this.resultState;
  }

  markPassed(): void {
    const startedAt = this.resultState.startedAt ?? Date.now();
    this.resultState = {
      status: "passed",
      startedAt,
      completedAt: Date.now(),
    };
  }

  markFailed(error: unknown): void {
    const startedAt = this.resultState.startedAt ?? Date.now();
    this.resultState = {
      status: "failed",
      error: normalizeError(error),
      startedAt,
      completedAt: Date.now(),
    };
  }

  markSkipped(reason?: string): void {
    const timestamp = Date.now();
    this.resultState = {
      status: "skipped",
      startedAt: this.resultState.startedAt ?? timestamp,
      completedAt: timestamp,
      ...(reason !== undefined ? { reason } : {}),
    };
  }

  markPending(reason?: string): void {
    const timestamp = Date.now();
    this.resultState = {
      status: "pending",
      startedAt: this.resultState.startedAt ?? timestamp,
      completedAt: timestamp,
      ...(reason !== undefined ? { reason } : {}),
    };
  }

  reset(): void {
    this.resultState = { status: "pending" };
  }
}

class ScenarioNodeImpl<World>
  extends ScenarioExecutionBase<World, SimpleScenario>
  implements ScenarioNode<World>
{
  constructor(init: ScenarioExecutionInit<World, SimpleScenario>) {
    super("scenario", init);
  }
}

class ScenarioOutlineExampleImpl<World>
  extends ScenarioExecutionBase<World, SimpleCompiledScenario>
  implements ScenarioOutlineExample<World>
{
  readonly outline: ScenarioOutlineNode<World>;
  readonly exampleGroup: SimpleExampleGroup;
  readonly compiled: SimpleCompiledScenario;
  readonly exampleIndex: number;

  constructor(init: ScenarioOutlineExampleInit<World>) {
    super("example", init);
    this.outline = init.outline;
    this.exampleGroup = init.exampleGroup;
    this.compiled = init.gherkin;
    this.exampleIndex = init.exampleIndex;
  }
}

class ScenarioOutlineNodeImpl<World>
  implements ScenarioOutlineNode<World>
{
  readonly type = "scenarioOutline" as const;
  readonly outline: SimpleScenarioOutline;
  readonly summary: ScenarioSummary<World>;
  readonly scope: ScopeNode<World>;
  readonly keyword: string;
  readonly name: string;
  readonly qualifiedName: string;
  readonly tags: readonly string[];
  readonly mode: ExecutionMode;
  readonly pending: boolean;
  readonly pendingReason?: string;
  readonly timeout?: TimeoutSpec;
  readonly data?: Record<string, unknown>;
  readonly ancestors: readonly ScopeNode<World>[];
  private readonly mutableExamples: ScenarioOutlineExample<World>[];
  readonly rule?: RuleNode<World>;
  readonly feature: FeatureNode<World>;

  constructor(init: ScenarioOutlineNodeInit<World>) {
    this.outline = init.outline;
    this.summary = init.summary;
    this.scope = init.scope;
    this.keyword = normalizeKeyword(init.keyword);
    this.name = init.name;
    this.qualifiedName = init.qualifiedName;
    this.tags = [...init.tags];
    this.mode = init.mode;
    this.pending = init.pending;
    if (init.pendingReason !== undefined) {
      this.pendingReason = init.pendingReason;
    }
    if (init.timeout !== undefined) {
      this.timeout = init.timeout;
    }
    const data = cloneData(init.data);
    if (data !== undefined) {
      this.data = data;
    }
    this.ancestors = [...init.ancestors];
    if (init.rule) {
      this.rule = init.rule;
    }
    this.feature = init.feature;
    this.mutableExamples = init.examples;
  }

  get examples(): readonly ScenarioOutlineExample<World>[] {
    return this.mutableExamples;
  }
}
