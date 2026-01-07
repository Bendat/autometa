import { describe, expect, it } from "vitest";

import { ensure as baseEnsure } from "../ensure";
import { createEnsureFactory, type AssertionPlugin } from "../plugins";

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
});
