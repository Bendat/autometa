import { describe, it, expectTypeOf } from "vitest";
import { BaseArgument } from "./arguments/base-argument";
import { Overload } from "./overload";
import {
  ArgumentTypes,
  ReturnTypes,
  ReturnTypeTuple,
  ValidatorArgumentTuple,
} from "./types";

describe("Type tests", () => {
  it("converts a list of BaseArguments to the types they wrap", () => {
    type testType = [
      BaseArgument<string>,
      BaseArgument<boolean>,
      BaseArgument<number>
    ];
    expectTypeOf<ValidatorArgumentTuple<testType>>().toEqualTypeOf<
      [string, boolean, number]
    >();
  });

  it("should infer the exact type of variadic BaseArguments", () => {
    type testType = [
      BaseArgument<string>,
      BaseArgument<boolean>,
      BaseArgument<number>
    ];
    expectTypeOf<ArgumentTypes<testType>>().toEqualTypeOf<
      [BaseArgument<string>, BaseArgument<boolean>, BaseArgument<number>]
    >();
  });

  it("Should derive a tuple of Return Types from overload functions", () => {
    type arguments = [
      BaseArgument<string>,
      BaseArgument<boolean>,
      BaseArgument<number>
    ];
    type testType = [
      Overload<arguments, () => number>,
      Overload<arguments, () => string>
    ];
    expectTypeOf<ReturnTypeTuple<testType>>().toEqualTypeOf<[number, string]>();
  });
  it("Should derive a union of Return Types from overload functions", () => {
    type arguments = [
      BaseArgument<string>,
      BaseArgument<boolean>,
      BaseArgument<number>
    ];
    type testType = [
      Overload<arguments, () => number>,
      Overload<arguments, () => string>
    ];
    type union = ReturnTypes<testType>;
    // type union = ReturnTypes<tuple>
    expectTypeOf<union>().toEqualTypeOf<number | string>();
  });
});
