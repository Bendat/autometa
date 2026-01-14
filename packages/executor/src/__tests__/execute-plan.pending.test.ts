import type { ExecutorConfig } from "@autometa/config";
import type {
  FeatureNode,
  ScenarioExecution,
  ScenarioNode,
  TestPlan,
} from "@autometa/test-builder";
import type {
  ScopeExecutionAdapter,
  ScopeNode,
  ScenarioSummary,
  ScopePlan,
} from "@autometa/scopes";
import { describe, expect, it, vi } from "vitest";

import { registerFeaturePlan } from "../execute-plan";
import type { ExecutorRuntime } from "../types";

function createScopeNode(kind: ScopeNode<unknown>["kind"], overrides?: Partial<ScopeNode<unknown>>): ScopeNode<unknown> {
  return {
    id: `${kind}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    name: overrides?.name ?? kind,
    mode: overrides?.mode ?? "default",
    tags: overrides?.tags ?? [],
    pending: overrides?.pending ?? false,
    ...(overrides?.pendingReason ? { pendingReason: overrides.pendingReason } : {}),
    timeout: overrides?.timeout,
    description: overrides?.description,
    source: overrides?.source,
    data: overrides?.data,
    examples: overrides?.examples,
    steps: overrides?.steps ?? [],
    hooks: overrides?.hooks ?? [],
    children: overrides?.children ?? [],
  };
}

function createSummary(feature: ScopeNode<unknown>, scenario: ScopeNode<unknown>): ScenarioSummary<unknown> {
  return {
    id: `summary-${Math.random().toString(36).slice(2, 8)}`,
    scenario,
    feature,
    ancestors: [],
    steps: [],
  };
}

function createFeatureNode(featureScope: ScopeNode<unknown>): FeatureNode<unknown> {
  const node: FeatureNode<unknown> = {
    type: "feature",
    name: featureScope.name,
    keyword: "Feature",
    feature: {} as never,
    scope: featureScope,
    scenarios: [],
    scenarioOutlines: [],
    rules: [],
    background: undefined,
    listExecutables: () => [],
  };
  return node;
}

function createAdapter(featureScope: ScopeNode<unknown>): {
  adapter: ScopeExecutionAdapter<unknown>;
  createWorld: ReturnType<typeof vi.fn>;
} {
  const rootScope = createScopeNode("root");
  const plan: ScopePlan<unknown> = {
    root: rootScope,
    stepsById: new Map(),
    hooksById: new Map(),
    scopesById: new Map([[featureScope.id, featureScope]]),
  };

  const createWorld = vi.fn(async () => ({}));

  const adapter: ScopeExecutionAdapter<unknown> = {
    plan,
    features: [featureScope],
    createWorld,
    getScope: vi.fn(() => undefined),
    getSteps: vi.fn(() => []),
    getHooks: vi.fn(() => []),
    getAncestors: vi.fn(() => []),
    listScenarios: () => [],
    getParameterRegistry: () => undefined,
  };

  return { adapter, createWorld };
}

function createScenarioExecution(
  featureNode: FeatureNode<unknown>,
  scenarioScope: ScopeNode<unknown>,
  summary: ScenarioSummary<unknown>,
  overrides?: Partial<ScenarioExecution<unknown>>
): ScenarioExecution<unknown> {
  return {
    id: `scenario-${Math.random().toString(36).slice(2, 8)}`,
    type: "scenario",
    name: overrides?.name ?? scenarioScope.name,
    keyword: "Scenario",
    qualifiedName: `${featureNode.name} ${scenarioScope.name}`,
    tags: overrides?.tags ?? [],
    mode: overrides?.mode ?? "default",
    pending: overrides?.pending ?? false,
    pendingReason: overrides?.pendingReason,
    timeout: overrides?.timeout,
    data: overrides?.data,
    feature: featureNode,
    rule: overrides?.rule,
    outline: overrides?.outline,
    scope: scenarioScope,
    summary,
    gherkin: {} as never,
    gherkinSteps: [],
    steps: [],
    ancestors: [],
    result: { status: "pending" },
    markPassed: overrides?.markPassed ?? vi.fn(),
    markFailed: overrides?.markFailed ?? vi.fn(),
    markSkipped: overrides?.markSkipped ?? vi.fn(),
    markPending: overrides?.markPending ?? vi.fn(),
    reset: overrides?.reset ?? vi.fn(),
  };
}

function createRuntime(overrides?: Partial<ExecutorRuntime["test"]>): ExecutorRuntime {
  const suite = Object.assign(
    (title: string, handler: () => void) => handler(),
    { skip: vi.fn(), only: vi.fn() }
  );

  const testBase = Object.assign(vi.fn(), {
    skip: vi.fn(),
    only: vi.fn(),
    concurrent: undefined,
    failing: undefined,
    fails: undefined,
  }) as ExecutorRuntime["test"];

  if (overrides?.todo) {
    (testBase as ExecutorRuntime["test"] & { todo: NonNullable<typeof overrides.todo> }).todo = overrides.todo;
  }

  if (overrides?.pending) {
    (testBase as ExecutorRuntime["test"] & { pending: NonNullable<typeof overrides.pending> }).pending = overrides.pending;
  }

  return {
    suite: suite as ExecutorRuntime["suite"],
    test: testBase as ExecutorRuntime["test"],
    beforeAll: vi.fn(),
    afterAll: vi.fn(),
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    currentTestName: vi.fn(),
  };
}

describe("registerFeaturePlan pending scenarios", () => {
  const config = { test: {} } as ExecutorConfig;

  it("uses test.todo when available", () => {
    const featureScope = createScopeNode("feature");
    const scenarioScope = createScopeNode("scenario", { pending: true, pendingReason: "todo reason" });
    const summary = createSummary(featureScope, scenarioScope);
    const featureNode = createFeatureNode(featureScope);
    const markPending = vi.fn();
    const scenarioExecution = createScenarioExecution(featureNode, scenarioScope, summary, {
      pending: true,
      pendingReason: "todo reason",
      markPending,
    });
    featureNode.scenarios = [scenarioExecution as unknown as ScenarioNode<unknown>];
    featureNode.listExecutables = () => [scenarioExecution];

    const plan: TestPlan<unknown> = {
      feature: featureNode,
      listExecutables: () => [scenarioExecution],
      listFailed: () => [],
      findById: () => scenarioExecution,
      findByQualifiedName: () => scenarioExecution,
    };

    const { adapter, createWorld } = createAdapter(featureScope);
    const todoFn = vi.fn();
    const runtime = createRuntime({ todo: todoFn });
    const skipSpy = runtime.test.skip as ReturnType<typeof vi.fn>;

    registerFeaturePlan({ plan, adapter, runtime, config });

    expect(todoFn).toHaveBeenCalledTimes(1);
    expect(todoFn).toHaveBeenCalledWith(scenarioExecution.name, "todo reason");
    expect(skipSpy).not.toHaveBeenCalled();
    expect(markPending).toHaveBeenCalledTimes(1);
    expect(markPending).toHaveBeenCalledWith("todo reason");
    expect(createWorld).not.toHaveBeenCalled();
  });

  it("falls back to test.pending when todo is unavailable", () => {
    const featureScope = createScopeNode("feature");
    const scenarioScope = createScopeNode("scenario", { pending: true });
    const summary = createSummary(featureScope, scenarioScope);
    const featureNode = createFeatureNode(featureScope);
    const markPending = vi.fn();
    const scenarioExecution = createScenarioExecution(featureNode, scenarioScope, summary, {
      pending: true,
      markPending,
    });
    featureNode.scenarios = [scenarioExecution as unknown as ScenarioNode<unknown>];
    featureNode.listExecutables = () => [scenarioExecution];

    const plan: TestPlan<unknown> = {
      feature: featureNode,
      listExecutables: () => [scenarioExecution],
      listFailed: () => [],
      findById: () => scenarioExecution,
      findByQualifiedName: () => scenarioExecution,
    };

    const { adapter } = createAdapter(featureScope);
    const pendingFn = vi.fn();
    const runtime = createRuntime({ pending: pendingFn });

    registerFeaturePlan({ plan, adapter, runtime, config });

    expect(pendingFn).toHaveBeenCalledTimes(1);
    expect(pendingFn).toHaveBeenCalledWith(scenarioExecution.name, undefined);
    expect(markPending).toHaveBeenCalledTimes(1);
  });

  it("falls back to skip when neither todo nor pending are provided", () => {
    const featureScope = createScopeNode("feature");
    const scenarioScope = createScopeNode("scenario", { pending: true });
    const summary = createSummary(featureScope, scenarioScope);
    const featureNode = createFeatureNode(featureScope);
    const markPending = vi.fn();
    const scenarioExecution = createScenarioExecution(featureNode, scenarioScope, summary, {
      pending: true,
      markPending,
    });
    featureNode.scenarios = [scenarioExecution as unknown as ScenarioNode<unknown>];
    featureNode.listExecutables = () => [scenarioExecution];

    const plan: TestPlan<unknown> = {
      feature: featureNode,
      listExecutables: () => [scenarioExecution],
      listFailed: () => [],
      findById: () => scenarioExecution,
      findByQualifiedName: () => scenarioExecution,
    };

    const { adapter } = createAdapter(featureScope);
    const runtime = createRuntime();
    const skipSpy = runtime.test.skip as ReturnType<typeof vi.fn>;

    registerFeaturePlan({ plan, adapter, runtime, config });

    expect(skipSpy).toHaveBeenCalledTimes(1);
    expect(markPending).toHaveBeenCalledTimes(1);
  });
});
