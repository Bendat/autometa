import { it, describe, expect, expectTypeOf } from "vitest";
import { number } from "./arguments/number-argument";
import { shape } from "./arguments/shape-argument";
import { string } from "./arguments/string-argument";
import { Shape } from "./arguments/types";
import { params } from "./params";

describe("Param list", () => {
  it("should create a new overload", () => {
    const wrapper = params(string(), number());
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
class Foo {
  a: number;
}
params(shape({ a: number() })).matches(foo=>{});