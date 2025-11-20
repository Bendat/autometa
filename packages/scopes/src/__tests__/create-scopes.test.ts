import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { createScopes } from "../index";
import { resetIdCounter } from "../id";
import type { HookContext, ScopeNode } from "../types";

interface TestWorld {
  readonly user?: string;
}

describe("createScopes DSL", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("builds a nested scope plan with steps", () => {
    const scopes = createScopes<TestWorld>();

    scopes.feature({ name: "Payments", tags: ["billing"] }, () => {
      scopes.rule({ name: "Validation", tags: ["rule"] }, () => {
        scopes.scenario({ name: "Successful payment" }, () => {
          const handler = (_world: TestWorld) => undefined;

          scopes.given("a valid customer", handler);
          scopes.when(/the payment is processed/, handler);
          scopes.then(
            "the transaction succeeds",
            handler,
            { tags: ["assertion"] }
          );
        });
      });
    });

    const plan = scopes.plan();

    expect(plan.root.name).toBe("global");
    expect(plan.root.children).toHaveLength(1);

    const feature = plan.root.children[0];
    expect(feature.kind).toBe("feature");
    expect(feature.tags).toEqual(["billing"]);
    expect(feature.children).toHaveLength(1);

    const rule = feature.children[0];
    expect(rule.kind).toBe("rule");
    expect(rule.tags).toEqual(["rule"]);
    expect(rule.children).toHaveLength(1);

    const scenario = rule.children[0];
    expect(scenario.kind).toBe("scenario");
    expect(scenario.steps).toHaveLength(3);
    expect(scenario.steps.map((step) => step.keyword)).toEqual(["Given", "When", "Then"]);
    expect(scenario.steps[0].expression).toBe("a valid customer");
    expect(scenario.steps[1].expression).toEqual(/the payment is processed/);
    expect(scenario.steps[2].options.tags).toEqual(["assertion"]);

    expect(plan.stepsById.size).toBe(3);
    expect(plan.hooksById.size).toBe(0);
  });

  it("applies tags configured via the step DSL", () => {
    const scopes = createScopes<TestWorld>();

    scopes.feature("Tagged Feature", () => {
      scopes.scenario("Tagged Scenario", () => {
        scopes.when.tags("@api")("the service is invoked", (_world) => undefined);

        scopes.when
          .tags(["@api", "@fast"])
          .failing("the service fails", (_world) => undefined);

        scopes.then.tags("@validation")(
          "the result is returned",
          (_world) => undefined,
          {
            tags: ["@response"],
          }
        );
      });
    });

    const plan = scopes.plan();
    const feature = plan.root.children[0];
    const scenario = feature.children[0];
    const [firstWhen, secondWhen, taggedThen] = scenario.steps;

    expect(firstWhen.options.tags).toEqual(["@api"]);
    expect(firstWhen.options.mode).toBe("default");
    expect(secondWhen.options.mode).toBe("failing");
    expect(secondWhen.options.tags).toEqual(["@api", "@fast"]);
    expect(taggedThen.options.tags).toEqual(["@validation", "@response"]);
  });

  it("applies execution mode variants across scopes and steps", () => {
    const scopes = createScopes<TestWorld>();

    scopes.feature.only("Focused Feature", () => {
      scopes.scenario.skip("Skipped Scenario", () => {
        scopes.given.failing("a flaky step", (_world: TestWorld) => undefined);
      });
    });

    const plan = scopes.plan();
    const feature = plan.root.children[0];
    const scenario = feature.children[0];
    const [step] = scenario.steps;

    expect(feature.mode).toBe("only");
    expect(scenario.mode).toBe("skip");
    expect(step.options.mode).toBe("failing");
  });

  it("supports concurrent execution mode for scopes and steps", () => {
    const scopes = createScopes<TestWorld>();

    scopes.feature("Concurrent Feature", () => {
      scopes.scenario.concurrent("Concurrent Scenario", () => {
        scopes.when.concurrent("a concurrent action", (_world) => undefined);
        scopes.then.tags("@fast").concurrent(
          "a concurrent assertion",
          (_world) => undefined,
          { tags: ["@extra"] }
        );
      });
    });

    const plan = scopes.plan();
    const feature = plan.root.children[0];
    const scenario = feature.children[0];
    const [whenStep, thenStep] = scenario.steps;

    expect(scenario.mode).toBe("concurrent");
    expect(whenStep.options.mode).toBe("concurrent");
    expect(thenStep.options.mode).toBe("concurrent");
    expect(thenStep.options.tags).toEqual(["@fast", "@extra"]);
  });

  it("lets execution variants override explicit mode options", () => {
    const scopes = createScopes<TestWorld>();

    scopes.feature("Variant Feature", () => {
      scopes.scenario.only({ name: "Scenario", mode: "skip" }, () => {
        scopes.then.only("then step", (_world) => undefined, { mode: "skip" });
      });
    });

    const plan = scopes.plan();
    const scenario = plan.root.children[0].children[0];
    const [step] = scenario.steps;

    expect(scenario.mode).toBe("only");
    expect(step.options.mode).toBe("only");
  });

  it("registers hooks with descriptions, options, and execution modes", () => {
    const scopes = createScopes<TestWorld>();

    scopes.beforeFeature("prepare feature", async (_ctx: HookContext<TestWorld>) => undefined, {
      tags: ["setup"],
      order: 1,
    });

    scopes.beforeScenario.only("focus scenario hook", (_ctx: HookContext<TestWorld>) => undefined);
    scopes.afterScenario.skip((_ctx: HookContext<TestWorld>) => undefined, { tags: ["cleanup"] });

    const plan = scopes.plan();
    const [featureHook, focusedHook, skippedHook] = plan.root.hooks;

    expect(featureHook.type).toBe("beforeFeature");
    expect(featureHook.description).toBe("prepare feature");
    expect(featureHook.options.tags).toEqual(["setup"]);
    expect(featureHook.options.order).toBe(1);

    expect(focusedHook.type).toBe("beforeScenario");
    expect(focusedHook.options.mode).toBe("only");

    expect(skippedHook.type).toBe("afterScenario");
    expect(skippedHook.options.mode).toBe("skip");
    expect(skippedHook.options.tags).toEqual(["cleanup"]);
  });

  it("applies configured default mode to scopes, steps, and hooks", () => {
    const scopes = createScopes<TestWorld>({ defaultMode: "skip" });

    scopes.feature("Feature", () => {
      scopes.beforeFeature((_ctx: HookContext<TestWorld>) => undefined);
      scopes.scenario("Scenario", () => {
        scopes.beforeScenario((_ctx: HookContext<TestWorld>) => undefined);
        scopes.given("step", (_world) => undefined);
      });
    });

    const plan = scopes.plan();
    const feature = plan.root.children[0];
    const scenario = feature.children[0];
    const [step] = scenario.steps;
    const [scenarioHook] = scenario.hooks;

    expect(plan.root.mode).toBe("skip");
    expect(feature.mode).toBe("skip");
    expect(scenario.mode).toBe("skip");
    expect(step.options.mode).toBe("skip");
    expect(scenarioHook.options.mode).toBe("skip");
  });

  it("populates lookup maps with scopes, steps, and hooks", () => {
    const scopes = createScopes<TestWorld>();

    let scenarioNode: ScopeNode<TestWorld> | undefined;

    scopes.feature("Lookup Feature", () => {
      scenarioNode = scopes.scenario("Lookup Scenario", () => {
        scopes.given("a step", (_world) => undefined);
        scopes.afterScenario((_ctx: HookContext<TestWorld>) => undefined, { order: 5 });
      });
    });

    const plan = scopes.plan();

    if (!scenarioNode) {
      throw new Error("Scenario scope was not created");
    }

    expect(plan.scopesById.get(scenarioNode.id)).toBe(scenarioNode);
    const [step] = scenarioNode.steps;
    expect(plan.stepsById.get(step.id)).toBe(step);
    const [hook] = scenarioNode.hooks;
    expect(plan.hooksById.get(hook.id)).toBe(hook);
  });

  it("prevents creating scenarios without a feature or rule", () => {
    const scopes = createScopes<TestWorld>();

    expect(() => scopes.scenario("orphan scenario")).toThrowError(
      /Cannot register scenario within root/
    );
  });

  it("prevents creating rules outside of a feature", () => {
    const scopes = createScopes<TestWorld>();

    expect(() => scopes.rule("lonely rule")).toThrowError(
      /Cannot register rule within root/
    );
  });

  it("allows scenario outlines within rules with examples", () => {
    const scopes = createScopes<TestWorld>();
    let outline: ScopeNode<TestWorld> | undefined;

    scopes.feature("Feature", () => {
      scopes.rule("Rule", () => {
        outline = scopes.scenarioOutline(
          {
            name: "Outline",
            examples: [
              {
                name: "Examples",
                tags: ["tagged"],
                table: [
                  ["col1", "col2"],
                  ["a", "b"],
                ],
              },
            ],
          },
          () => undefined
        );
      });
    });

    if (!outline) {
      throw new Error("Scenario outline was not created");
    }

    expect(outline.kind).toBe("scenarioOutline");
    expect(outline.name).toBe("Outline");
    expect(outline.examples).toEqual([
      {
        name: "Examples",
        tags: ["tagged"],
        table: [
          ["col1", "col2"],
          ["a", "b"],
        ],
      },
    ]);
    expect(outline.id).toMatch(/^scenarioOutline-/);
  });

  it("exposes provided world factory and parameter registry on the plan", async () => {
    const worldFactory = vi.fn(async (_context: { readonly scope: ScopeNode<TestWorld> }) => ({
      user: "plan",
    }));
    const parameterRegistry = { lookupByTypeName: vi.fn() };

    const scopes = createScopes<TestWorld>({
      worldFactory,
      parameterRegistry,
    });

    scopes.feature("Feature", () => {
      scopes.scenario("Scenario", () => {
        scopes.given("a step", (_world) => undefined);
      });
    });

    const plan = scopes.plan();

    expect(plan.worldFactory).toBe(worldFactory);
    expect(plan.parameterRegistry).toBe(parameterRegistry);
    const featureScope = plan.root.children[0];
    const createdWorld =
      plan.worldFactory && featureScope
        ? await plan.worldFactory({ scope: featureScope })
        : undefined;
    expect(createdWorld).toEqual({ user: "plan" });
    expect(parameterRegistry.lookupByTypeName).not.toHaveBeenCalled();
  });

  it("infers cucumber expression argument types", () => {
    type Color = { readonly name: string };
    type ExpressionTypes = { readonly color: Color };

    const scopes = createScopes<TestWorld, ExpressionTypes>();

    scopes.given("a {int} and {string}", (_world, count, label) => {
      expectTypeOf(count).toEqualTypeOf<number>();
      expectTypeOf(label).toEqualTypeOf<string>();
    });

    scopes.when("a {color}", (_world, color) => {
      expectTypeOf(color).toEqualTypeOf<Color>();
    });

    scopes.then("no parameters", (_world) => {
      expectTypeOf(_world).toEqualTypeOf<TestWorld>();
    });

    scopes.and("value {}", (_world, value) => {
      expectTypeOf(value).toEqualTypeOf<string>();
    });
  });
});
