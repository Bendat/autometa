import type { FeatureNode, ScenarioExecution } from "@autometa/test-builder";
import type { ScopeExecutionAdapter, ScopeNode, ScenarioSummary, StepDefinition } from "@autometa/scopes";
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
      gherkinSteps: [{}, {}] as never,
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
      gherkinSteps: steps.map(() => ({})) as never,
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
    } as unknown as ScopeExecutionAdapter<unknown>;

    await expect(runScenarioExecution(execution, { adapter })).rejects.toThrow(failure);

    expect(markFailed).toHaveBeenCalledTimes(1);
    expect(markFailed).toHaveBeenCalledWith(failure);
    expect(markPassed).not.toHaveBeenCalled();
    expect(appDispose).toHaveBeenCalledTimes(1);
    expect(containerDispose).toHaveBeenCalledTimes(1);
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
