import { describe, expect, it } from "vitest";
import { ScopeComposer } from "../scope-composer";
import type { ScopeNode } from "../types";

type World = { readonly id?: string };

describe("ScopeComposer", () => {
  it("normalizes pending states and metadata", () => {
    const composer = new ScopeComposer<World>({ defaultMode: "skip" });

    const pendingTrue = composer.createScope(
      "feature",
      "Pending True",
      { pending: true, timeout: 100, description: "desc", tags: ["t1"], data: { flag: true } },
      undefined,
      ["root"]
    );

    const pendingReason = composer.enterScope(pendingTrue, () =>
      composer.createScope(
        "rule",
        "Pending Reason",
        { pending: "waiting", examples: [{ name: "ex", table: [["a"]] }] },
        undefined,
        ["feature"]
      )
    ) as ScopeNode<World>;

    expect(pendingTrue.pending).toBe(true);
    expect(pendingTrue.pendingReason).toBeUndefined();
    expect(pendingTrue.tags).toEqual(["t1"]);
    expect(pendingTrue.timeout).toBe(100);
    expect(pendingTrue.mode).toBe("skip");

    expect(pendingReason.pending).toBe(true);
    expect(pendingReason.pendingReason).toBe("waiting");
    expect(pendingReason.examples?.[0]?.table[0]).toEqual(["a"]);
  });

  it("throws when parent scope is invalid and restores stack on error", () => {
    const composer = new ScopeComposer<World>();

    expect(() => composer.createScope("scenario", "Orphan", {}, undefined, ["feature"]))
      .toThrow(/Cannot register scenario/);

    // stack should still allow creating a feature afterwards
    const feature = composer.createScope("feature", "Feature", {}, undefined, ["root"]);
    expect(feature.name).toBe("Feature");
  });

  it("registers hooks and steps with normalized options", () => {
    const composer = new ScopeComposer<World>();
    const feature = composer.createScope("feature", "Feature", {}, undefined, ["root"]);
    const loose = composer.createScope("rule", "Loose", {}, undefined);
    expect(loose.name).toBe("Loose");

    const step = composer.registerStep("Given", "expr", () => undefined, {
      tags: ["a", "b"],
      data: { key: "value" },
    });
    expect(step.options.tags).toEqual(["a", "b"]);
    expect(step.options.mode).toBe("default");

    const hook = composer.registerHook("beforeScenario", () => undefined, { order: 2, data: { n: 1 } });
    expect(hook.options.order).toBe(2);
    expect(hook.options.data?.n).toBe(1);

    expect(composer.plan.stepsById.get(step.id)).toBe(step);
    expect(composer.plan.hooksById.get(hook.id)).toBe(hook);
    expect(composer.plan.scopesById.get(feature.id)).toBe(feature);
  });

  it("throws when current scope stack is empty", () => {
    const composer = new ScopeComposer<World>();
    // @ts-expect-error test mutation to simulate corrupted stack
    composer.stack.pop();
    expect(() => composer.currentScope).toThrow(/No active scope context/);
  });

  it("uses custom id factories when provided", () => {
    const ids = ["id-1", "id-2", "id-3", "id-4"];
    const composer = new ScopeComposer<World>({ idFactory: () => ids.shift() ?? "fallback" });

    const feature = composer.createScope("feature", "Feature", {}, undefined, ["root"]);
    const step = composer.registerStep("Given", "x", () => undefined);
    const hook = composer.registerHook("beforeFeature", () => undefined);

    expect(feature.id).toBe("id-2");
    expect(step.id).toBe("id-3");
    expect(hook.id).toBe("id-4");
  });

  it("handles empty pending reasons and copies sources and timeouts", () => {
    const composer = new ScopeComposer<World>({ defaultMode: "only" });

    const feature = composer.createScope(
      "feature",
      "Feature",
      { pending: "   ", source: { file: "feature.ts", line: 10 }, timeout: 50 },
      undefined,
      ["root"]
    );

    const hook = composer.registerHook(
      "beforeFeature",
      () => undefined,
      { timeout: 10 },
      "desc",
      { file: "hook.ts", line: 1, column: 2 }
    );

    expect(feature.pending).toBe(true);
    expect(feature.pendingReason).toBeUndefined();
    expect(feature.source).toEqual({ file: "feature.ts", line: 10 });
    expect(hook.options.timeout).toBe(10);
    expect(hook.source).toEqual({ file: "hook.ts", line: 1, column: 2 });
  });
});
