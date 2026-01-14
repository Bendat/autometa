import { describe, expect, it } from "vitest";
import { DecoratorScopeRegistry } from "../decorator-registry";
import type { DecoratorHookDescriptor, DecoratorScenarioDescriptor, HookContext } from "../types";

type World = { readonly value?: number };

const featureToken = Symbol("feature");
const ruleToken = Symbol("rule");
const scenarioToken = Symbol("scenario");

function noopHook(_ctx: HookContext<World>): void {
  return undefined;
}

function makeScenarioDescriptor(kind: DecoratorScenarioDescriptor["kind"]): DecoratorScenarioDescriptor {
  return {
    kind,
    name: `${kind}-name`,
  };
}

describe("DecoratorScopeRegistry", () => {
  it("builds a scope plan with features, rules, scenarios, steps, and hooks", () => {
    const registry = new DecoratorScopeRegistry<World>();

    registry.registerFeature(featureToken, {
      name: "Feature",
      description: "desc",
      tags: ["@a"],
      timeout: { duration: 5, unit: "s" },
      mode: "only",
      data: { file: "feat.feature" },
    });

    registry.registerHook(featureToken, {
      type: "beforeFeature",
      handler: noopHook,
      options: { tags: ["setup"], order: 1 },
    });

    registry.registerRule(featureToken, ruleToken, {
      name: "Rule",
      tags: ["@rule"],
    });

    registry.registerHook(ruleToken, {
      type: "afterRule",
      handler: noopHook,
    });

    registry.registerScenario(scenarioToken, makeScenarioDescriptor("scenario"), {
      feature: featureToken,
      rule: ruleToken,
    });

    registry.registerHook(scenarioToken, {
      type: "beforeScenario",
      handler: noopHook,
    });

    registry.registerStep(scenarioToken, {
      keyword: "Given",
      expression: "a step",
      handler: (_world: World) => undefined,
    });

    const plan = registry.build();

    const [feature] = plan.root.children;
    expect(feature?.name).toBe("Feature");
    expect(feature?.hooks[0]?.type).toBe("beforeFeature");
    expect(feature?.children[0]?.name).toBe("Rule");

    const rule = feature?.children[0];
    const scenario = rule?.children[0];
    expect(scenario?.name).toBe("scenario-name");
    expect(scenario?.hooks[0]?.type).toBe("beforeScenario");
    expect(scenario?.steps[0]?.expression).toBe("a step");
  });

  it("throws for duplicate registrations and missing parents", () => {
    const registry = new DecoratorScopeRegistry<World>();
    registry.registerFeature(featureToken, { name: "Feature" });

    expect(() => registry.registerFeature(featureToken, { name: "Feature" })).toThrow(
      /already registered/
    );

    expect(() => registry.registerRule(Symbol("unknown"), ruleToken, { name: "Rule" })).toThrow(
      /Feature token not registered/
    );

    registry.registerRule(featureToken, ruleToken, { name: "Rule" });
    expect(() => registry.registerRule(featureToken, ruleToken, { name: "Rule" })).toThrow(
      /Rule token already registered/
    );

    expect(() =>
      registry.registerScenario(Symbol("missing"), makeScenarioDescriptor("scenario"), {
        feature: Symbol("unknown-feature"),
      })
    ).toThrow(/Feature token not registered/);

    const duplicateScenarioToken = Symbol("duplicate");
    registry.registerScenario(duplicateScenarioToken, makeScenarioDescriptor("scenario"), {
      feature: featureToken,
    });
    expect(() =>
      registry.registerScenario(duplicateScenarioToken, makeScenarioDescriptor("scenario"), {
        feature: featureToken,
      })
    ).toThrow(/Scenario token already registered/);

    const ruleDup = Symbol("rule-scenario");
    registry.registerRule(featureToken, Symbol("another-rule"), { name: "Rule" });
    registry.registerScenario(ruleDup, makeScenarioDescriptor("scenario"), {
      feature: featureToken,
      rule: ruleToken,
    });
    expect(() =>
      registry.registerScenario(ruleDup, makeScenarioDescriptor("scenario"), {
        feature: featureToken,
        rule: ruleToken,
      })
    ).toThrow(/already registered for rule/);
  });

  it("rejects steps and hooks for unknown tokens", () => {
    const registry = new DecoratorScopeRegistry<World>();
    registry.registerFeature(featureToken, { name: "Feature" });

    expect(() =>
      registry.registerStep(Symbol("bad"), {
        keyword: "Given",
        expression: "x",
        handler: (_world: World) => undefined,
      })
    ).toThrow(/scenario token/);

    expect(() =>
      registry.registerHook(Symbol("bad"), {
        type: "beforeFeature",
        handler: noopHook,
      })
    ).toThrow(/Hook token not registered/);
  });

  it("enforces hook compatibility with scope", () => {
    const registry = new DecoratorScopeRegistry<World>();
    registry.registerFeature(featureToken, { name: "Feature" });

    const incompatibleHook: DecoratorHookDescriptor<World> = {
      type: "beforeScenario",
      handler: noopHook,
    };
    registry.registerHook(featureToken, incompatibleHook);

    expect(() => registry.build()).toThrow(/cannot be registered on feature/);
  });

  it("requires decorator descriptors to include a name", () => {
    const registry = new DecoratorScopeRegistry<World>();
    registry.registerFeature(featureToken, {
      name: "Feature",
      description: "desc",
    });
    registry.registerScenario(scenarioToken, {
      kind: "scenario",
      // @ts-expect-error intentional for runtime path
      name: "",
    }, { feature: featureToken });

    expect(() => registry.build()).toThrow(/missing required name/);
  });

  it("supports scenario outlines with examples and hook descriptions", () => {
    const registry = new DecoratorScopeRegistry<World>();
    registry.registerFeature(featureToken, { name: "Feature" });
    registry.registerRule(featureToken, ruleToken, { name: "Rule" });

    const examples = [
      {
        name: "row",
        tags: ["@tag"],
        table: [
          ["h1"],
          ["v1"],
        ],
      },
    ];

    registry.registerScenario(
      scenarioToken,
      {
        kind: "scenarioOutline",
        name: "Outline",
        description: "outline desc",
        examples,
        timeout: 5,
        mode: "only",
        source: { file: "outline.ts", line: 1, column: 2 },
        data: { key: "value" },
      },
      { feature: featureToken, rule: ruleToken }
    );

    registry.registerHook(scenarioToken, {
      type: "beforeScenarioOutline",
      description: "hook",
      handler: noopHook,
    });

    const plan = registry.build();
    const outline = plan.root.children[0]?.children[0]?.children[0];

    expect(outline?.examples?.[0]?.table[1]).toEqual(["v1"]);
    expect(outline?.pending).toBe(false);
    expect(outline?.source).toEqual({ file: "outline.ts", line: 1, column: 2 });
  });

  it("errors when scenario rule tokens are missing", () => {
    const registry = new DecoratorScopeRegistry<World>();
    registry.registerFeature(featureToken, { name: "Feature" });

    expect(() =>
      registry.registerScenario(Symbol("missing"), makeScenarioDescriptor("scenario"), {
        feature: featureToken,
        rule: Symbol("missing"),
      })
    ).toThrow(/Rule token not registered/);
  });
});
