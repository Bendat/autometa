import { describe, expect, it, vi } from "vitest";

import type { FeatureNode, ScenarioExecution } from "@autometa/test-builder";
import type { ScenarioSummary, ScopeNode, StepDefinition } from "@autometa/scopes";
import type { SimplePickle, SimplePickleFeatureRef, SimplePickleScenarioRef, SimplePickleStep } from "@autometa/gherkin";
import { registerTestListener, resetEventBus } from "@autometa/events";

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

describe("runScenarioExecution events", () => {
  it("emits step events when pickle context is provided", async () => {
    resetEventBus();

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

    const handler = vi.fn();
    const steps: StepDefinition<unknown>[] = [
      {
        id: "step-1",
        keyword: "Given",
        expression: "a thing happens",
        handler,
        options: { tags: [], mode: "default" },
      },
    ];

    const gherkinStepId = "gherkin-step-1";
    const featureRef: SimplePickleFeatureRef = {
      id: "pickle-feature-1",
      name: "Feature",
      location: { line: 1, column: 1 },
      tags: [],
      comments: [],
    };
    const scenarioRef: SimplePickleScenarioRef = {
      id: "pickle-scenario-1",
      name: "Scenario",
      location: { line: 2, column: 1 },
      tags: [],
      comments: [],
      type: "scenario",
    };

    const pickleStep: SimplePickleStep = {
      id: gherkinStepId,
      text: "a thing happens",
      keyword: "Given ",
      keywordType: "given",
      type: "context",
      location: { line: 3, column: 1 },
      comments: [],
      astNodeIds: [gherkinStepId],
      scenario: scenarioRef,
      feature: featureRef,
      tags: [],
      language: "en",
      uri: "feature.feature",
    };

    const pickle: SimplePickle = {
      id: "pickle-1",
      name: "Scenario",
      language: "en",
      steps: [pickleStep],
      tags: [],
      uri: "feature.feature",
      feature: featureRef,
      scenario: scenarioRef,
    };

    const execution: ScenarioExecution<unknown> = {
      id: "scenario-1",
      type: "scenario",
      name: "Scenario",
      keyword: "Scenario",
      qualifiedName: "Feature Scenario",
      tags: [],
      mode: "default",
      pending: false,
      pendingReason: undefined,
      feature: featureNode,
      scope: scenarioScope,
      summary,
      gherkin: {} as never,
      gherkinSteps: [
        { id: gherkinStepId, text: pickleStep.text, keyword: pickleStep.keyword },
      ] as never,
      steps,
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

    const seen: Array<{ type: string; status?: unknown }> = [];
    const unsubscribe = registerTestListener({
      onStepStarted({ event }) {
        seen.push({ type: event.type });
      },
      onStepCompleted({ event }) {
        seen.push({ type: event.type, status: event.metadata?.status });
      },
    });

    const invokeHooks = vi.fn(async () => undefined);
    const context: ScenarioRunContext<unknown> = {
      world: {},
      parameterRegistry: undefined,
      beforeStepHooks: [],
      afterStepHooks: [],
      events: { pickle },
      invokeHooks,
    };

    await runScenarioExecution(execution, context);
    unsubscribe();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([
      { type: "step.started" },
      { type: "step.completed", status: "passed" },
    ]);
  });
});
