import { test } from "vitest";
import { it, describe, expect, expectTypeOf } from "vitest";
import { number } from "./arguments/number-argument";
import { string } from "./arguments/string-argument";
import { def } from "./def";

describe("Param list", () => {
  it("should create a new overload", () => {
    const wrapper = def(string(), number());
    const overload = wrapper.matches((_a, _b) => 1);
    const func = overload.action;
    type returns = ReturnType<typeof func>;
    type params = Parameters<typeof func>;
    expectTypeOf<returns>().toEqualTypeOf<number>();
    expectTypeOf<params>().toEqualTypeOf<[string, number]>();

    expect(func.length).toEqual(2);
    expect(overload.args.length).toEqual(2);
  });
  it("should create a new overload with a name and description", () => {
    const wrapper = def`myNamedDef`('optional description', string(), number());
    const overload = wrapper.matches((_a, _b) => 1);
    const func = overload.action;
    type returns = ReturnType<typeof func>;
    type params = Parameters<typeof func>;
    expectTypeOf<returns>().toEqualTypeOf<number>();
    expectTypeOf<params>().toEqualTypeOf<[string, number]>();

    expect(func.length).toEqual(2);
    expect(overload.args.length).toEqual(2);
  });

  it("should create a new overload with a name and no description", () => {
    const wrapper = def`myNamedDef`(string(), number());
    const overload = wrapper.matches((_a, _b) => 1);
    const func = overload.action;
    type returns = ReturnType<typeof func>;
    type params = Parameters<typeof func>;
    expectTypeOf<returns>().toEqualTypeOf<number>();
    expectTypeOf<params>().toEqualTypeOf<[string, number]>();

    expect(func.length).toEqual(2);
    expect(overload.args.length).toEqual(2);
  });
});
