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
