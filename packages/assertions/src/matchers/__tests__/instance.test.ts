import { describe, expect, it } from "vitest";

import { TestMatcherError, createMatcherContext } from "../../__tests__/helpers/matcher-context";
import { assertToBeInstanceOf } from "../instance";

describe("instance matcher", () => {
  class Base {}
  class Derived extends Base {
    public readonly flag = true;
  }

  it("passes when value is instance of constructor", () => {
    const ctx = createMatcherContext<Base | Derived>(new Derived());
    const result = assertToBeInstanceOf(ctx, Derived);
    expect(result.flag).toBe(true);
  });

  it("fails when constructor is not callable", () => {
    const ctx = createMatcherContext({});
    expect(() => assertToBeInstanceOf(ctx, null as unknown as new () => unknown)).toThrowError(
      TestMatcherError
    );
  });

  it("fails when value is not instance", () => {
    const ctx = createMatcherContext<Base | Derived>(new Base());
    expect(() => assertToBeInstanceOf(ctx, Derived)).toThrowError(TestMatcherError);
  });

  it("respects negated rule", () => {
    const ctx = createMatcherContext<Base | Derived>(new Base(), { negated: true });
    expect(() => assertToBeInstanceOf(ctx, Derived)).not.toThrow();
    const negatedCtx = createMatcherContext<Base | Derived>(new Derived(), { negated: true });
    expect(() => assertToBeInstanceOf(negatedCtx, Derived)).toThrowError(TestMatcherError);
  });
});
