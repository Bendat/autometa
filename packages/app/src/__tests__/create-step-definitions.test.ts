import { describe, expect, it, beforeEach } from "vitest";
import { createStepDefinitions } from "../create-step-definitions";
import type { StepCallback, StepExpression, StepRuntimeContext, ScopeKeyResolver } from "../types";

class FakeDsl {
  readonly steps: Array<{ keyword: string; expression: StepExpression; handler: StepCallback }> = [];
  readonly beforeHooks: StepCallback[] = [];
  readonly afterHooks: StepCallback[] = [];
  readonly afterAllHooks: StepCallback[] = [];

  Given(expression: StepExpression, handler: StepCallback) {
    this.steps.push({ keyword: "Given", expression, handler });
  }

  When(expression: StepExpression, handler: StepCallback) {
    this.steps.push({ keyword: "When", expression, handler });
  }

  Then(expression: StepExpression, handler: StepCallback) {
    this.steps.push({ keyword: "Then", expression, handler });
  }

  And(expression: StepExpression, handler: StepCallback) {
    this.steps.push({ keyword: "And", expression, handler });
  }

  But(expression: StepExpression, handler: StepCallback) {
    this.steps.push({ keyword: "But", expression, handler });
  }

  Before(handler: StepCallback) {
    this.beforeHooks.push(handler);
  }

  After(handler: StepCallback) {
    this.afterHooks.push(handler);
  }

  AfterAll(handler: StepCallback) {
    this.afterAllHooks.push(handler);
  }
}

class FeatureWorld {
  scenarios = 0;
}

class RuleWorld {
  name = "rule";
}

class OutlineWorld {
  examples: string[] = [];
}

class ScenarioWorld {
  count = 0;
}

interface TestContext extends StepRuntimeContext {
  scope: {
    feature: string;
    rule?: string;
    outline?: string;
    scenario: string;
  };
}

function createContext(scope: TestContext["scope"]): TestContext {
  return {
    scope,
    pickle: {
      id: scope.scenario,
      name: scope.scenario,
      astNodeIds: [scope.rule, scope.outline].filter((value): value is string => Boolean(value)),
    },
    gherkinDocument: {
      feature: {
        name: scope.feature,
      },
    },
  } satisfies TestContext;
}

const keyResolver: ScopeKeyResolver<TestContext> = {
  feature: (context) => context.scope.feature,
  rule: (context) => context.scope.rule,
  outline: (context) => context.scope.outline,
  scenario: (context) => context.scope.scenario,
};

describe("createStepDefinitions", () => {
  let dsl: FakeDsl;

  beforeEach(() => {
    dsl = new FakeDsl();
  });

  it("injects scenario world into step callbacks", async () => {
    const worlds: ScenarioWorld[] = [];

    const suite = createStepDefinitions(ScenarioWorld, {
      feature: FeatureWorld,
      rule: RuleWorld,
      outline: OutlineWorld,
      dsl,
      keyResolver,
    });

    suite.Given("a scenario", (...args) => {
      const [world] = args as [ScenarioWorld & { feature: FeatureWorld; rule: RuleWorld; outline: OutlineWorld }];
      worlds.push(world);
      world.count += 1;
    });

    const context = createContext({ feature: "Feature", rule: "Rule", outline: "Outline", scenario: "Scenario-1" });

    await dsl.beforeHooks[0].call(context, context);
    await dsl.steps[0].handler.call(context);
    await dsl.afterHooks[0].call(context, context);
    await dsl.afterAllHooks[0]?.call(context);

    expect(worlds).toHaveLength(1);
    const [world] = worlds;
    expect(world).toBeInstanceOf(ScenarioWorld);
    expect(world.count).toBe(1);
  expect((world as ScenarioWorld & { feature: FeatureWorld }).feature).toBeInstanceOf(FeatureWorld);
  expect((world as ScenarioWorld & { rule: RuleWorld }).rule).toBeInstanceOf(RuleWorld);
  expect((world as ScenarioWorld & { outline: OutlineWorld }).outline).toBeInstanceOf(OutlineWorld);
  });

  it("reuses feature scope while resetting scenario world", async () => {
    const suite = createStepDefinitions(ScenarioWorld, {
      feature: FeatureWorld,
      dsl,
      keyResolver,
    });

    let firstWorld: ScenarioWorld | undefined;
    let secondWorld: ScenarioWorld | undefined;
    let featureWorld: FeatureWorld | undefined;

    suite.Given("track worlds", (...args) => {
      const [world] = args as [ScenarioWorld & { feature?: FeatureWorld }];
      if (!firstWorld) {
        firstWorld = world;
        featureWorld = world.feature;
      } else {
        secondWorld = world;
      }
    });

    const scenarioOne = createContext({ feature: "Feature", scenario: "Scenario-1" });
    await dsl.beforeHooks[0].call(scenarioOne, scenarioOne);
    await dsl.steps[0].handler.call(scenarioOne);
    await dsl.afterHooks[0].call(scenarioOne, scenarioOne);

    const scenarioTwo = createContext({ feature: "Feature", scenario: "Scenario-2" });
    await dsl.beforeHooks[0].call(scenarioTwo, scenarioTwo);
    await dsl.steps[0].handler.call(scenarioTwo);
    await dsl.afterHooks[0].call(scenarioTwo, scenarioTwo);
    await dsl.afterAllHooks[0]?.call(scenarioTwo);

    expect(firstWorld).toBeInstanceOf(ScenarioWorld);
    expect(secondWorld).toBeInstanceOf(ScenarioWorld);
    expect(firstWorld).not.toBe(secondWorld);
  expect((firstWorld as ScenarioWorld & { feature?: FeatureWorld })?.feature).toBe(featureWorld);
  expect((secondWorld as ScenarioWorld & { feature?: FeatureWorld })?.feature).toBe(featureWorld);
  });

  it("notifies lifecycle hooks for feature transitions", async () => {
    const suite = createStepDefinitions(ScenarioWorld, {
      feature: FeatureWorld,
      dsl,
      keyResolver,
    });

    const events: string[] = [];

    suite.hooks.BeforeFeature(({ feature }) => {
      const typed = feature as FeatureWorld;
      events.push(`before:${typed.constructor.name}`);
    });
    suite.hooks.AfterFeature(({ feature }) => {
      const typed = feature as FeatureWorld;
      events.push(`after:${typed.constructor.name}`);
    });

    suite.Given("noop", () => undefined);

    const featureA1 = createContext({ feature: "Feature-A", scenario: "Scenario-A1" });
    await dsl.beforeHooks[0].call(featureA1, featureA1);
    await dsl.steps[0].handler.call(featureA1);
    await dsl.afterHooks[0].call(featureA1, featureA1);

    const featureA2 = createContext({ feature: "Feature-A", scenario: "Scenario-A2" });
    await dsl.beforeHooks[0].call(featureA2, featureA2);
    await dsl.steps[0].handler.call(featureA2);
    await dsl.afterHooks[0].call(featureA2, featureA2);

    const featureB = createContext({ feature: "Feature-B", scenario: "Scenario-B" });
    await dsl.beforeHooks[0].call(featureB, featureB);
    await dsl.steps[0].handler.call(featureB);
    await dsl.afterHooks[0].call(featureB, featureB);
    await dsl.afterAllHooks[0]?.call(featureB);

    expect(events).toEqual([
      "before:FeatureWorld",
      // No additional before for second scenario in same feature
      "after:FeatureWorld", // triggered when switching to feature B
      "before:FeatureWorld",
      "after:FeatureWorld", // triggered at AfterAll cleanup
    ]);
  });

  it("wraps thrown errors as AutomationError with context", async () => {
    const suite = createStepDefinitions(ScenarioWorld, {
      dsl,
      keyResolver,
    });

    suite.Given("failing step", () => {
      throw new Error("Boom");
    });

    const context = createContext({ feature: "Feature", scenario: "Scenario" });

    await dsl.beforeHooks[0].call(context, context);
    await expect(async () => dsl.steps[0].handler.call(context)).rejects.toThrowError(/Step failed/);
  });

  it("supports fluent flow builder", async () => {
    const suite = createStepDefinitions(ScenarioWorld, {
      dsl,
      keyResolver,
    });

    suite.flow
      .given("flow given").run(() => undefined)
      .when("flow when").run(() => undefined)
      .then("flow then").run(() => undefined);

    expect(dsl.steps.map((entry) => entry.expression)).toEqual([
      "flow given",
      "flow when",
      "flow then",
    ]);
  });
});
