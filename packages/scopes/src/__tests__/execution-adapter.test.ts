import { beforeEach, describe, expect, it } from "vitest";
import { createScopes } from "../create-scopes";
import { createExecutionAdapter } from "../execution-adapter";
import { resetIdCounter } from "../id";
import type { HookContext, ScopeNode } from "../types";

interface TestWorld {
  readonly name: string;
}

describe("createExecutionAdapter", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("provides feature and scenario summaries with world creation", async () => {
    const scopes = createScopes<TestWorld>({
      worldFactory: async () => ({ name: "world" }),
    });

    let scenarioNode: ScopeNode<TestWorld> | undefined;

    scopes.feature("Feature", () => {
      scopes.beforeFeature((_ctx: HookContext<TestWorld>) => undefined);
      scopes.rule("Rule", () => {
        scenarioNode = scopes.scenario("Scenario", () => {
          scopes.given("a step", (_world) => undefined);
        });
      });
    });

    if (!scenarioNode) {
      throw new Error("Scenario not created");
    }

    const plan = scopes.plan();
    const adapter = createExecutionAdapter(plan);

    expect(adapter.features).toHaveLength(1);
    expect(adapter.features[0].name).toBe("Feature");

    const scenarios = adapter.listScenarios();
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0].scenario).toBe(scenarioNode);
    expect(scenarios[0].feature.name).toBe("Feature");
    expect(scenarios[0].rule?.name).toBe("Rule");
    expect(scenarios[0].ancestors.map((scope) => scope.kind)).toEqual(["feature", "rule"]);
    expect(scenarios[0].steps).toHaveLength(1);

    expect(adapter.getScope(scenarioNode.id)).toBe(scenarioNode);
    expect(adapter.getSteps(scenarioNode.id)).toHaveLength(1);
    expect(adapter.getHooks(scenarioNode.id)).toHaveLength(0);

    const world = await adapter.createWorld();
    expect(world).toEqual({ name: "world" });
  });

  it("uses fallback options when plan lacks world factory or registry", async () => {
    const scopes = createScopes<TestWorld>();
    scopes.feature("Feature", () => {
      scopes.scenario("Scenario", () => {
        scopes.given("step", (_world) => undefined);
      });
    });

    const fallbackWorldFactory: () => Promise<TestWorld> = async () => ({ name: "fallback" });
    const parameterRegistry = { defineParameterType: () => undefined };

    const adapter = createExecutionAdapter(scopes.plan(), {
      worldFactory: fallbackWorldFactory,
      parameterRegistry,
    });

    const world = await adapter.createWorld();
    expect(world).toEqual({ name: "fallback" });
    expect(adapter.getParameterRegistry()).toBe(parameterRegistry);
  });

  it("throws if no world factory is available", async () => {
    const scopes = createScopes<TestWorld>();
  scopes.feature("Feature", () => undefined);
    const adapter = createExecutionAdapter(scopes.plan());
    await expect(adapter.createWorld()).rejects.toThrow(/No world factory configured/);
  });
});
