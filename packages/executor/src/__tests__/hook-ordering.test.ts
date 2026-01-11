import { describe, expect, it, vi } from "vitest";

import { resetEventBus } from "@autometa/events";
import { createExecutionAdapter, createScopes, type HookContext, type ScenarioSummary } from "@autometa/scopes";
import type { FeatureNode, ScenarioExecution } from "@autometa/test-builder";

import { ScopeLifecycle } from "../scope-lifecycle";

function createFeatureNode(feature: ScenarioSummary<unknown>["feature"]): FeatureNode<unknown> {
  return {
    type: "feature",
    name: feature.name,
    keyword: "Feature",
    feature: { language: "en" } as never,
    scope: feature,
    scenarios: [],
    scenarioOutlines: [],
    rules: [],
    background: undefined,
    listExecutables: () => [],
  };
}

function createExecution(summary: ScenarioSummary<unknown>): ScenarioExecution<unknown> {
  const featureNode = createFeatureNode(summary.feature);
  return {
    id: `scenario-${summary.scenario.id}`,
    type: "scenario",
    name: summary.scenario.name,
    keyword: "Scenario",
    qualifiedName: `${featureNode.name} ${summary.scenario.name}`,
    tags: [],
    mode: "default",
    pending: false,
    pendingReason: undefined,
    feature: featureNode,
    rule: summary.rule ? ({ scope: summary.rule } as never) : undefined,
    outline: undefined,
    scope: summary.scenario,
    summary,
    gherkin: {} as never,
    gherkinSteps: [],
    steps: summary.steps,
    ancestors: summary.ancestors,
    result: { status: "pending" },
    markPassed: vi.fn(),
    markFailed: vi.fn(),
    markSkipped: vi.fn(),
    markPending: vi.fn(),
    reset: vi.fn(),
  } as unknown as ScenarioExecution<unknown>;
}

describe("hook ordering", () => {
  it("defaults hook order to 5 (so explicit lower order wins)", async () => {
    resetEventBus();

    const calls: string[] = [];
    const scopes = createScopes<unknown>();

    scopes.beforeScenario("default order", async (_ctx: HookContext<unknown>) => {
      calls.push("default");
    });

    scopes
      .beforeScenario("explicit order", async (_ctx: HookContext<unknown>) => {
        calls.push("ordered");
      })
      .order(1);

    scopes.feature("Feature", () => {
      scopes.scenario("Scenario", () => undefined);
    });

    const adapter = createExecutionAdapter(scopes.plan(), {
      worldFactory: async () => ({}),
    });
    const lifecycle = new ScopeLifecycle(adapter);
    const summary = adapter.listScenarios()[0];
    if (!summary) {
      throw new Error("Expected at least one scenario");
    }
    const execution = createExecution(summary);
    const hooks = lifecycle.collectScenarioHooks(execution);

    await lifecycle.runScenario(execution, hooks, async () => undefined);

    expect(calls).toEqual(["ordered", "default"]);
  });

  it("runs before hooks from nested scopes first when order ties", async () => {
    resetEventBus();

    const calls: string[] = [];
    const scopes = createScopes<unknown>();

    scopes.beforeScenario(async (_ctx: HookContext<unknown>) => {
      calls.push("root");
    });

    scopes.feature("Feature", () => {
      scopes.beforeScenario(async (_ctx: HookContext<unknown>) => {
        calls.push("feature");
      });

      scopes.scenario("Scenario", () => {
        scopes.beforeScenario(async (_ctx: HookContext<unknown>) => {
          calls.push("scenario");
        });
      });
    });

    const adapter = createExecutionAdapter(scopes.plan(), {
      worldFactory: async () => ({}),
    });
    const lifecycle = new ScopeLifecycle(adapter);
    const summary = adapter.listScenarios()[0];
    if (!summary) {
      throw new Error("Expected at least one scenario");
    }
    const execution = createExecution(summary);
    const hooks = lifecycle.collectScenarioHooks(execution);

    await lifecycle.runScenario(execution, hooks, async () => undefined);

    expect(calls).toEqual(["scenario", "feature", "root"]);
  });
});
