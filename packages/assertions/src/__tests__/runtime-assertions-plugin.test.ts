import { describe, expect, it } from "vitest";

import { createEnsureFactory, ensure as baseEnsure } from "../index";
import { runtimeAssertionsPlugin } from "../plugins/runtime-assertions-plugin";

import type { StepRuntimeHelpers } from "@autometa/executor";

type World = {
  runtime: StepRuntimeHelpers;
};

describe("runtimeAssertionsPlugin", () => {
  it("supports plugin-level negation for presence checks", () => {
    const table = { kind: "table" } as const;

    const worldWithTable: World = {
      runtime: {
        hasTable: true,
        hasDocstring: false,
        consumeDocstring: () => undefined,
        consumeTable: () => table as unknown,
        requireTable: () => table as unknown,
      } as StepRuntimeHelpers,
    };

    const worldWithoutTable: World = {
      runtime: {
        hasTable: false,
        hasDocstring: false,
        consumeDocstring: () => undefined,
        consumeTable: () => undefined,
        requireTable: () => {
          throw new Error("missing table");
        },
      } as StepRuntimeHelpers,
    };

    const ensureFactory = createEnsureFactory(baseEnsure, {
      runtime: runtimeAssertionsPlugin<World>(),
    });

    expect(() =>
      ensureFactory(worldWithTable).runtime.hasTable()
    ).not.toThrow();
    expect(() =>
      ensureFactory(worldWithTable).not.runtime.hasTable()
    ).toThrow();

    expect(() => ensureFactory(worldWithoutTable).runtime.hasTable()).toThrow();
    expect(() =>
      ensureFactory(worldWithoutTable).not.runtime.hasTable()
    ).not.toThrow();
  });

  it("does not invert required extraction under plugin-level .not", () => {
    const world: World = {
      runtime: {
        hasTable: false,
        hasDocstring: false,
        consumeDocstring: () => undefined,
        consumeTable: () => undefined,
        requireTable: () => {
          throw new Error("missing table");
        },
      } as StepRuntimeHelpers,
    };

    const ensureFactory = createEnsureFactory(baseEnsure, {
      runtime: runtimeAssertionsPlugin<World>(),
    });

    expect(() => ensureFactory(world).runtime.requireDocstring()).toThrow();
    expect(() => ensureFactory(world).not.runtime.requireDocstring()).toThrow();

    expect(() =>
      ensureFactory(world).runtime.requireTable("horizontal")
    ).toThrow();
    expect(() =>
      ensureFactory(world).not.runtime.requireTable("horizontal")
    ).toThrow();
  });
});
