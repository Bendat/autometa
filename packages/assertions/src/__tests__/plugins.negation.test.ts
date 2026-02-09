import { describe, expect, it } from "vitest";

import { ensure as baseEnsure } from "../ensure";
import {
  createDefaultEnsureFactory,
  createEnsureFactory,
  type AssertionPlugin,
} from "../plugins";

interface World {
  readonly body?: string;
}

interface TestFacet {
  requireBody(): string;
  assertBodyEquals(expected: string): void;
  isNotFlag(): boolean;
}

const testPlugin: AssertionPlugin<World, TestFacet> = ({ ensure, isNot }) => (world) => ({
  requireBody() {
    return ensure.always(world.body, { label: "body" }).toBeDefined().value;
  },
  assertBodyEquals(expected: string) {
    const body = ensure.always(world.body, { label: "body" }).toBeDefined().value;
    ensure(body, { label: "body equality" }).toStrictEqual(expected);
  },
  isNotFlag() {
    return isNot;
  },
});

describe("createEnsureFactory plugin negation", () => {
  it("does not invert required-value extraction under plugin-level .not", () => {
    const factory = createEnsureFactory(baseEnsure, { test: testPlugin });
    const ensure = factory({ body: undefined });

    expect(() => ensure.test.requireBody()).toThrow();
    expect(() => ensure.not.test.requireBody()).toThrow();
  });

  it("still negates assertion matchers under plugin-level .not", () => {
    const factory = createEnsureFactory(baseEnsure, { test: testPlugin });
    const ensure = factory({ body: "hello" });

    // Positive facet should pass.
    expect(() => ensure.test.assertBodyEquals("hello")).not.toThrow();

    // Negated facet should invert the matcher and therefore fail.
    expect(() => ensure.not.test.assertBodyEquals("hello")).toThrow();
  });

  it("passes an explicit isNot flag to plugins", () => {
    const factory = createEnsureFactory(baseEnsure, { test: testPlugin });
    const ensure = factory({ body: "hello" });

    expect(ensure.test.isNotFlag()).toBe(false);
    expect(ensure.not.test.isNotFlag()).toBe(true);
  });

  it("creates a default ensure facade without plugins", () => {
    const factory = createDefaultEnsureFactory<World>();
    const ensure = factory({ body: "hello" });

    ensure("hello").toBe("hello");
    expect(ensure.world).toEqual({ body: "hello" });
    expect(ensure.not).toEqual({});
  });

  it("throws when a plugin is missing for negated facet creation", () => {
    let accessCount = 0;
    const stablePlugin: AssertionPlugin<World, { probe(): void }> = ({ isNot }) => () => ({
      probe() {
        void isNot;
      },
    });

    const flakyPlugins = {} as Record<string, AssertionPlugin<World, unknown>>;
    Object.defineProperty(flakyPlugins, "flaky", {
      enumerable: true,
      configurable: true,
      get() {
        accessCount += 1;
        return accessCount === 1 ? stablePlugin : undefined;
      },
    });

    expect(() => createEnsureFactory(baseEnsure, flakyPlugins)).toThrow(
      'Assertion plugin "flaky" is not defined.'
    );
  });

  it("throws when a plugin is missing for positive facet creation", () => {
    const missingPlugins = {
      missing: undefined,
    } as unknown as Record<string, AssertionPlugin<World, unknown>>;

    expect(() => createEnsureFactory(baseEnsure, missingPlugins)).toThrow(
      'Assertion plugin "missing" is not defined.'
    );
  });
});
