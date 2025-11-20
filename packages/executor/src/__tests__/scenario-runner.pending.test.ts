import path from "node:path";

import type { FeatureNode, ScenarioExecution } from "@autometa/test-builder";
import type { ScopeNode, ScenarioSummary, StepDefinition } from "@autometa/scopes";
import { GherkinStepError, getGherkinErrorContext } from "@autometa/errors";
import { describe, expect, it, vi } from "vitest";

import { Pending } from "../pending";
import { runScenarioExecution } from "../scenario-runner";
import type { ScenarioRunContext } from "../scope-lifecycle";

function createScopeNode(kind: ScopeNode<unknown>["kind"]): ScopeNode<unknown> {
  return {
    id: `${kind}-id`,
    kind,
    name: kind,
    mode: "default",
    tags: [],
    pending: false,
    steps: [],
    hooks: [],
    children: [],
  };
}

describe("runScenarioExecution pending handling", () => {
  it("marks the scenario as pending and stops executing remaining steps", async () => {
    const scenarioScope = createScopeNode("scenario");
    const featureScope = createScopeNode("feature");

    const featureNode: FeatureNode<unknown> = {
      type: "feature",
      name: "Feature",
      keyword: "Feature",
      feature: {} as never,
      scope: featureScope,
      scenarios: [],
      scenarioOutlines: [],
      rules: [],
      background: undefined,
      listExecutables: () => [],
    };

    const summary: ScenarioSummary<unknown> = {
      id: "summary-1",
      scenario: scenarioScope,
      feature: featureScope,
      ancestors: [],
      steps: [],
    };

    const markPending = vi.fn();
    const markFailed = vi.fn();
    const markPassed = vi.fn();
    const markSkipped = vi.fn();
    const reset = vi.fn();
    const secondHandler = vi.fn();

    const steps: StepDefinition<unknown>[] = [
      {
        id: "step-1",
        keyword: "Given",
        expression: "",
        handler: Pending("  needs implementation  "),
        options: { tags: [], mode: "default" },
      },
      {
        id: "step-2",
        keyword: "Then",
        expression: "",
        handler: (world: unknown) => {
          void world;
          secondHandler();
        },
        options: { tags: [], mode: "default" },
      },
    ];

    const execution: ScenarioExecution<unknown> = {
      id: "scenario-1",
      type: "scenario",
      name: "Pending scenario",
      keyword: "Scenario",
      qualifiedName: "Feature Pending scenario",
      tags: [],
      mode: "default",
      pending: false,
      pendingReason: undefined,
      feature: featureNode,
      scope: scenarioScope,
      summary,
      gherkin: {} as never,
      gherkinSteps: [
        { text: "", keyword: "Given " },
        { text: "", keyword: "Then " },
      ] as never,
      steps,
      ancestors: [],
      result: { status: "pending" },
      markPassed,
      markFailed,
      markSkipped,
      markPending,
      reset,
      rule: undefined,
      outline: undefined,
    } as unknown as ScenarioExecution<unknown>;

    const invokeHooks = vi.fn(async () => undefined);
    const context: ScenarioRunContext<unknown> = {
      world: {},
      parameterRegistry: undefined,
      beforeStepHooks: [],
      afterStepHooks: [],
      invokeHooks,
    };

    await expect(runScenarioExecution(execution, context)).resolves.toBeUndefined();

    expect(markPending).toHaveBeenCalledTimes(1);
    expect(markPending).toHaveBeenCalledWith("needs implementation");
    expect(markFailed).not.toHaveBeenCalled();
    expect(markPassed).not.toHaveBeenCalled();
    expect(secondHandler).not.toHaveBeenCalled();
    expect(invokeHooks).toHaveBeenCalledTimes(2);
  });
});

describe("runScenarioExecution status transitions", () => {
  function createScenarioExecutionWithSteps(
    steps: StepDefinition<unknown>[]
  ): {
    execution: ScenarioExecution<unknown>;
    markPassed: ReturnType<typeof vi.fn>;
    markFailed: ReturnType<typeof vi.fn>;
    markPending: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
  } {
    const scenarioScope = createScopeNode("scenario");
    const featureScope = createScopeNode("feature");

    const featureNode: FeatureNode<unknown> = {
      type: "feature",
      name: "Feature",
      keyword: "Feature",
      feature: {} as never,
      scope: featureScope,
      scenarios: [],
      scenarioOutlines: [],
      rules: [],
      background: undefined,
      listExecutables: () => [],
    };

    const summary: ScenarioSummary<unknown> = {
      id: "summary-disposal",
      scenario: scenarioScope,
      feature: featureScope,
      ancestors: [],
      steps: [],
    };

    const markPassed = vi.fn();
    const markFailed = vi.fn();
    const markPending = vi.fn();
    const markSkipped = vi.fn();
    const reset = vi.fn();

    const execution: ScenarioExecution<unknown> = {
      id: "scenario-disposal",
      type: "scenario",
      name: "Disposal scenario",
      keyword: "Scenario",
      qualifiedName: "Feature Disposal scenario",
      tags: [],
      mode: "default",
      pending: false,
      pendingReason: undefined,
      feature: featureNode,
      scope: scenarioScope,
      summary,
      gherkin: {} as never,
      gherkinSteps: steps.map(() => ({ text: "", keyword: "" })) as never,
      steps,
      ancestors: [],
      result: { status: "pending" },
      markPassed,
      markFailed,
      markSkipped,
      markPending,
      reset,
      rule: undefined,
      outline: undefined,
    } as unknown as ScenarioExecution<unknown>;

    return { execution, markPassed, markFailed, markPending, reset };
  }

  function createScenarioContext(
    world: unknown = {}
  ): {
    context: ScenarioRunContext<unknown>;
    invokeHooks: ReturnType<typeof vi.fn>;
  } {
    const invokeHooks = vi.fn(async () => undefined);
    const context: ScenarioRunContext<unknown> = {
      world,
      parameterRegistry: undefined,
      beforeStepHooks: [],
      afterStepHooks: [],
      invokeHooks,
    };
    return { context, invokeHooks };
  }

  it("marks the scenario as passed when all steps succeed", async () => {
    const step: StepDefinition<unknown> = {
      id: "step-success",
      keyword: "Given",
      expression: "",
      handler: vi.fn(),
      options: { tags: [], mode: "default" },
    };

    const { execution, markPassed, markFailed } = createScenarioExecutionWithSteps([step]);
    const { context, invokeHooks } = createScenarioContext();

    await expect(runScenarioExecution(execution, context)).resolves.toBeUndefined();

    expect(markPassed).toHaveBeenCalledTimes(1);
    expect(markFailed).not.toHaveBeenCalled();
    expect(invokeHooks).toHaveBeenCalledTimes(2);
    const afterCall = invokeHooks.mock.calls[1]?.[1] as { step?: { status?: string } } | undefined;
    expect(afterCall?.step?.status).toBe("passed");
  });

  it("marks the scenario as failed when a step throws", async () => {
    const failure = new Error("step failure");

    const step: StepDefinition<unknown> = {
      id: "step-failure",
      keyword: "Then",
      expression: "",
      handler: vi.fn(async () => {
        throw failure;
      }),
      options: { tags: [], mode: "default" },
    };

    const { execution, markPassed, markFailed } = createScenarioExecutionWithSteps([step]);
    const { context, invokeHooks } = createScenarioContext();

    let thrown: unknown;
    await runScenarioExecution(execution, context).catch((error: unknown) => {
      thrown = error;
    });

    expect(thrown).toBeInstanceOf(GherkinStepError);
    const wrapped = thrown as GherkinStepError;
    expect(wrapped.cause).toBe(failure);

    expect(markFailed).toHaveBeenCalledTimes(1);
    expect(markFailed).toHaveBeenCalledWith(wrapped);
    expect(markPassed).not.toHaveBeenCalled();
    expect(invokeHooks).toHaveBeenCalledTimes(2);
    const afterCall = invokeHooks.mock.calls[1]?.[1] as { step?: { status?: string } } | undefined;
    expect(afterCall?.step?.status).toBe("failed");
  });

  it("wraps step failures with gherkin metadata", async () => {
    const failure = new Error("annotated failure");
    const featurePath = path.resolve("features/sample.feature");
    const stepPath = path.resolve("src/steps/sample.ts");

    const step: StepDefinition<unknown> = {
      id: "step-annotated",
      keyword: "Given",
      expression: "a failing step",
      handler: vi.fn(async () => {
        throw failure;
      }),
      options: { tags: [], mode: "default" },
      source: { file: stepPath, line: 42, column: 7 },
    };

    const scenarioScope = createScopeNode("scenario");
    scenarioScope.source = { file: featurePath, line: 8, column: 1 };

    const featureScope = createScopeNode("feature");
    featureScope.source = { file: featurePath, line: 1, column: 1 };

    const featureNode: FeatureNode<unknown> = {
      type: "feature",
      name: "Feature",
      keyword: "Feature",
      feature: { uri: featurePath, location: { line: 1, column: 1 } } as never,
      scope: featureScope,
      scenarios: [],
      scenarioOutlines: [],
      rules: [],
      background: undefined,
      listExecutables: () => [],
    };

    const summary: ScenarioSummary<unknown> = {
      id: "summary-context",
      scenario: scenarioScope,
      feature: featureScope,
      ancestors: [],
      steps: [],
    };

    const execution: ScenarioExecution<unknown> = {
      id: "scenario-context",
      type: "scenario",
      name: "Context scenario",
      keyword: "Scenario",
      qualifiedName: "Feature Context scenario",
      tags: [],
      mode: "default",
      pending: false,
      pendingReason: undefined,
      feature: featureNode,
      scope: scenarioScope,
      summary,
      gherkin: { location: { line: 8, column: 1 } } as never,
      gherkinSteps: [
        {
          keyword: "Given ",
          text: "a failing step",
          location: { line: 12, column: 5 },
        },
      ] as never,
      steps: [step],
      ancestors: [],
      result: { status: "pending" },
      markPassed: vi.fn(),
      markFailed: vi.fn(),
      markSkipped: vi.fn(),
      markPending: vi.fn(),
      reset: vi.fn(),
      rule: undefined,
      outline: undefined,
    } as unknown as ScenarioExecution<unknown>;

    const { context } = createScenarioContext();

    let thrown: unknown;
    await runScenarioExecution(execution, context).catch((error: unknown) => {
      thrown = error;
    });

    expect(thrown).toBeInstanceOf(GherkinStepError);
    const gherkinContext = getGherkinErrorContext(thrown);
    expect(gherkinContext?.gherkin?.location.filePath).toBe(featurePath);
    expect(gherkinContext?.gherkin?.location.start.line).toBe(12);
    expect(gherkinContext?.code?.location.filePath).toBe(stepPath);
    expect(gherkinContext?.code?.location.start.line).toBe(42);
    expect(gherkinContext?.path?.map((segment) => segment.role)).toEqual([
      "feature",
      "scenario",
      "step",
    ]);
    const featureSegment = gherkinContext?.path?.[0];
    expect(featureSegment?.location.start.line).toBe(1);
    const scenarioSegment = gherkinContext?.path?.[1];
    expect(scenarioSegment?.location.start.line).toBe(8);
    const stepSegment = gherkinContext?.path?.[gherkinContext.path.length - 1]!;
    expect(stepSegment.location.start.line).toBe(12);
  });
});
