import { describe, expect, it, vi } from "vitest";
import { createScopes } from "../create-scopes";
import { ScopeComposer } from "../scope-composer";
import {
  createFeatureBuilder,
  createHookBuilder,
  createRuleBuilder,
  createScenarioBuilder,
} from "../dsl-builders";

describe("dsl builders edge cases", () => {
  it("returns the correct mode variant when tags are empty", () => {
    const scopes = createScopes();

    scopes.feature("Feature", () => {
      const scenario = scopes.scenario("Scenario", () => undefined);
      expect(scenario).toBeDefined();
    });

    expect(scopes.given.skip.tags()).toBe(scopes.given.skip);
    expect(scopes.given.only.tags()).toBe(scopes.given.only);
    expect(scopes.given.failing.tags()).toBe(scopes.given.failing);
    expect(scopes.given.concurrent.tags()).toBe(scopes.given.concurrent);
    expect(scopes.given.tags()).toBe(scopes.given);
  });

  it("rejects non-finite hook order values", () => {
    const composer = new ScopeComposer();
    const builder = createHookBuilder(composer, "beforeFeature");
    const hookRegistration = builder(() => undefined);

    expect(() => hookRegistration.order(Number.NaN)).toThrow(/finite number/);
  });

  it("respects existing order implementations on hook definitions", () => {
    const composer = new ScopeComposer();
    const registration = {
      id: "hook",
      type: "beforeFeature" as const,
      handler: () => undefined,
      options: {},
      order: () => registration,
    };

    vi.spyOn(composer as unknown as { registerHook: () => unknown }, "registerHook").mockReturnValue(
registration);                                                                                                  

    const builder = createHookBuilder(composer, "beforeFeature");
    const result = builder(() => undefined);
    expect(result).toBe(registration);
    vi.restoreAllMocks();
  });

  it("captures metadata for files, examples, and pending reasons", () => {
    const exampleTable = [
      ["col"],
      ["val"],
    ];

    const scopes = createScopes();

    scopes.feature({ name: "Feature", file: "example.feature", data: { name: "Example" } }, () => {
      scopes.scenarioOutline(
        {
          title: "Outline",
          description: "desc",
          pending: { reason: " later " },
          examples: [
            {
              name: "row",
              tags: ["@x"],
              table: exampleTable,
            },
          ],
        },
        () => undefined
      );
    });

    // mutate the original inputs to ensure deep cloning occurred
    exampleTable[1]?.push("mutated");

    const feature = scopes.plan().root.children[0];
    const outline = feature?.children[0];

    expect(feature?.data?.file).toBe("example.feature");
    expect(feature?.name).toBe("Feature");
    expect(outline?.pending).toBe(true);
    expect(outline?.pendingReason).toBe("later");
    expect(outline?.description).toBe("desc");
    expect(outline?.examples?.[0]?.table[1]).toEqual(["val"]);
    expect(outline?.examples?.[0]?.tags).toEqual(["@x"]);
  });

  it("normalizes scope arguments for action provided as third parameter and default names", () => {
    const composer = new ScopeComposer();
    const featureComposerBuilder = createFeatureBuilder(composer);

    const ruleAction = vi.fn();
    const scenarioAction = vi.fn();

    const ruleBuilder = createRuleBuilder(composer);
    const scenarioBuilder = createScenarioBuilder(composer, "scenario");
    const outlineBuilder = createScenarioBuilder(composer, "scenarioOutline");

    featureComposerBuilder("feature-name", undefined, () => {
      ruleBuilder(123 as unknown as string, undefined, () => {
        scenarioBuilder(undefined as unknown as string, undefined, scenarioAction);
        outlineBuilder("   ", undefined, () => undefined);
        ruleAction();
      });
    });

    expect(ruleAction).toHaveBeenCalled();
    expect(scenarioAction).toHaveBeenCalled();

    const rule = composer.plan.root.children[0]?.children[0];
    expect(rule?.name).toBe("rule");
    const scenario = rule?.children[0];
    expect(scenario?.name).toBe("scenario");
    const outline = rule?.children[1];
    expect(outline?.name).toBe("scenario outline");
  });

  it("derives metadata from .feature filenames", () => {
    const composer = new ScopeComposer();
    const featureBuilder = createFeatureBuilder(composer);
    featureBuilder("path/to/story.feature", () => undefined);

    const feature = composer.plan.root.children[0];
    expect(feature?.data?.file).toBe("path/to/story.feature");
    expect(feature?.name).toBe("path/to/story.feature");
  });
});
