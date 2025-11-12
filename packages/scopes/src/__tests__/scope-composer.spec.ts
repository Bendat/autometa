import { describe, expect, it, vi } from "vitest";
import { ScopeComposer } from "../scope-composer";
import type { CreateScopesOptions, ParameterRegistryLike, ScopeNode } from "../types";

interface World {
  readonly value?: number;
}

describe("ScopeComposer", () => {
  const createComposer = (options: CreateScopesOptions<World> = {}) =>
    new ScopeComposer<World>(options);

  const currentScope = (composer: ScopeComposer<World>): ScopeNode<World> => composer.currentScope;

  it("creates nested scopes with metadata inheritance", () => {
    const composer = createComposer({ defaultMode: "only" });

    const feature = composer.createScope(
      "feature",
      "Auth",
      { tags: ["@feature"], data: { file: "auth.feature" } },
      () => {
        composer.createScope(
          "scenario",
          "login succeeds",
          { tags: ["@scenario"], timeout: { duration: 5, unit: "s" } },
          () => {
            composer.registerStep("Given", /user exists/, vi.fn(), { tags: ["@step"] });
          },
          ["feature", "rule"]
        );
      },
      ["root"]
    );

    expect(feature.name).toBe("Auth");
    expect(feature.children).toHaveLength(1);
    const [scenario] = feature.children;
    expect(scenario.name).toBe("login succeeds");
    expect(scenario.timeout).toEqual({ duration: 5, unit: "s" });
    expect(scenario.tags).toContain("@scenario");
    expect(scenario.steps).toHaveLength(1);
    expect(scenario.steps[0].keyword).toBe("Given");
  });

  it("enforces parent scope constraints", () => {
    const composer = createComposer();

    expect(() =>
      composer.createScope("scenario", "invalid", {}, undefined, ["rule"])
    ).toThrow(/Cannot register scenario within root/);
  });

  it("registers steps and hooks with normalized options", () => {
    const composer = createComposer({ defaultMode: "default" });

    const feature = composer.createScope("feature", "Feature", {}, undefined, ["root"]);
    composer.enterScope(feature);

    const step = composer.registerStep("When", "action", vi.fn(), {
      tags: ["@fast"],
      timeout: 1000,
    });
    expect(step.options).toMatchObject({ tags: ["@fast"], timeout: 1000, mode: "default" });

    const hook = composer.registerHook("beforeScenario", vi.fn(), {
      tags: ["@hook"],
      order: 2,
    });
    expect(hook.options).toMatchObject({ tags: ["@hook"], order: 2, mode: "default" });
  });

  it("merges plan metadata including world factory and parameter registry", async () => {
    const worldFactory = vi.fn(async () => ({ value: 42 } satisfies World));
  const parameterRegistry: ParameterRegistryLike = { defineParameterType: vi.fn() };
    const composer = createComposer({ worldFactory, parameterRegistry });

    const plan = composer.plan;
    expect(plan.worldFactory).toBe(worldFactory);
    expect(plan.parameterRegistry).toBe(parameterRegistry);
    expect(plan.root.kind).toBe("root");

    const adapterWorld = await plan.worldFactory?.();
    expect(adapterWorld).toEqual({ value: 42 });
    expect(worldFactory).toHaveBeenCalled();
  });

  it("throws when registering steps or hooks without an active scope", () => {
    const composer = createComposer();

    expect(() => composer.registerStep("Given", /no scope/, vi.fn())).not.toThrow();

    const scope = currentScope(composer);
    composer.enterScope(scope, () => {});

    expect(() => composer.registerHook("afterFeature", vi.fn())).not.toThrow();
  });
});
