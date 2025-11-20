import path from "node:path";

import type { FeatureNode, ScenarioExecution } from "@autometa/test-builder";
import type { ScopeExecutionAdapter, ScopeNode, ScenarioSummary, StepDefinition } from "@autometa/scopes";
import { GherkinStepError, getGherkinErrorContext } from "@autometa/errors";
import { describe, expect, it, vi } from "vitest";

import { Pending } from "../pending";
import { runScenarioExecution } from "../scenario-runner";

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

    const adapter = {
      createWorld: vi.fn(async () => ({})),
      getParameterRegistry: vi.fn(() => undefined),
    } as unknown as ScopeExecutionAdapter<unknown>;

    await expect(runScenarioExecution(execution, { adapter })).resolves.toBeUndefined();

    expect(markPending).toHaveBeenCalledTimes(1);
    expect(markPending).toHaveBeenCalledWith("needs implementation");
    expect(markFailed).not.toHaveBeenCalled();
    expect(markPassed).not.toHaveBeenCalled();
    expect(secondHandler).not.toHaveBeenCalled();
  });
});

describe("runScenarioExecution world disposal", () => {
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

  it("disposes app and container after successful execution", async () => {
    const step: StepDefinition<unknown> = {
      id: "step-success",
      keyword: "Given",
      expression: "",
      handler: vi.fn(),
      options: { tags: [], mode: "default" },
    };

    const { execution, markPassed, markFailed } = createScenarioExecutionWithSteps([step]);

    const appDispose = vi.fn().mockResolvedValue(undefined);
    const containerDispose = vi.fn().mockResolvedValue(undefined);

    const world = {
      app: { dispose: appDispose },
      di: { dispose: containerDispose },
    };

    const adapter = {
      createWorld: vi.fn(async () => world),
      getParameterRegistry: vi.fn(() => undefined),
    } as unknown as ScopeExecutionAdapter<unknown>;

    await expect(runScenarioExecution(execution, { adapter })).resolves.toBeUndefined();

    expect(markPassed).toHaveBeenCalledTimes(1);
    expect(markFailed).not.toHaveBeenCalled();
    expect(appDispose).toHaveBeenCalledTimes(1);
    expect(containerDispose).toHaveBeenCalledTimes(1);
  });

  it("disposes world resources when a step throws", async () => {
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

    const appDispose = vi.fn().mockResolvedValue(undefined);
    const containerDispose = vi.fn().mockResolvedValue(undefined);

    const world = {
      app: { dispose: appDispose },
      di: { dispose: containerDispose },
    };

    const adapter = {
      createWorld: vi.fn(async () => world),
      getParameterRegistry: vi.fn(() => undefined),
    } as unknown as ScopeExecutionAdapter<unknown>;

    let thrown: unknown;
    await runScenarioExecution(execution, { adapter }).catch((error: unknown) => {
      thrown = error;
    });

    expect(thrown).toBeInstanceOf(GherkinStepError);
    const wrapped = thrown as GherkinStepError;
    expect(wrapped.cause).toBe(failure);

    expect(markFailed).toHaveBeenCalledTimes(1);
    expect(markFailed).toHaveBeenCalledWith(wrapped);
    expect(markPassed).not.toHaveBeenCalled();
    expect(appDispose).toHaveBeenCalledTimes(1);
    expect(containerDispose).toHaveBeenCalledTimes(1);
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

    const adapter = {
      createWorld: vi.fn(async () => ({})),
      getParameterRegistry: vi.fn(() => undefined),
    } as unknown as ScopeExecutionAdapter<unknown>;

    let thrown: unknown;
    await runScenarioExecution(execution, { adapter }).catch((error: unknown) => {
      thrown = error;
    });

    expect(thrown).toBeInstanceOf(GherkinStepError);
    const context = getGherkinErrorContext(thrown);
    expect(context?.gherkin?.location.filePath).toBe(featurePath);
    expect(context?.gherkin?.location.start.line).toBe(12);
    expect(context?.code?.location.filePath).toBe(stepPath);
    expect(context?.code?.location.start.line).toBe(42);
    expect(context?.path?.map((segment) => segment.role)).toEqual([
      "feature",
      "scenario",
      "step",
    ]);
    const featureSegment = context?.path?.[0];
    expect(featureSegment?.location.start.line).toBe(1);
    const scenarioSegment = context?.path?.[1];
    expect(scenarioSegment?.location.start.line).toBe(8);
    const stepSegment = context?.path?.[context.path.length - 1]!;
    expect(stepSegment.location.start.line).toBe(12);
  });

  it("aggregates errors thrown while disposing world resources", async () => {
    const step: StepDefinition<unknown> = {
      id: "step-clean",
      keyword: "Given",
      expression: "",
      handler: vi.fn(),
      options: { tags: [], mode: "default" },
    };

    const { execution, markPassed, markFailed } = createScenarioExecutionWithSteps([step]);

    const appError = new Error("app dispose failure");
    const containerError = new Error("container dispose failure");

    const appDispose = vi.fn(async () => {
      throw appError;
    });
    const containerDispose = vi.fn(async () => {
      throw containerError;
    });

    const world = {
      app: { dispose: appDispose },
      di: { dispose: containerDispose },
    };

    const adapter = {
      createWorld: vi.fn(async () => world),
      getParameterRegistry: vi.fn(() => undefined),
    } as unknown as ScopeExecutionAdapter<unknown>;

    let thrown: unknown;
    await runScenarioExecution(execution, { adapter }).catch((error: unknown) => {
      thrown = error;
    });

    expect(thrown).toBeInstanceOf(Error);
    const error = thrown as Error;
    expect(error.message).toBe("Multiple errors occurred while disposing world resources");
    const causeDescriptor = Object.getOwnPropertyDescriptor(error, "cause");
    expect(causeDescriptor?.value).toEqual([appError, containerError]);
    expect(markPassed).toHaveBeenCalledTimes(1);
    expect(markFailed).not.toHaveBeenCalled();
    expect(appDispose).toHaveBeenCalledTimes(1);
    expect(containerDispose).toHaveBeenCalledTimes(1);
  });
});
