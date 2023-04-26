import { describe, it } from "vitest";
import { BaseArgument, Shape } from "./base-argument";
import { number } from "./number-argument";
import { shape, ShapeArgument } from "./shape-argument";
import { string } from "./string-argument";

describe("Shape Argument", () => {
  it("should verify that the shape matches", () => {
    const obj = shape({
      a: string("a"),
      b: shape({ c: number() }),
    }) as ShapeArgument<{
      a: BaseArgument<string>;
      b: BaseArgument<Shape>;
    }>;

    obj.withIndex(0);

    // const res = obj.assertShapeMatches({ a: "hi" });
    const res2 = obj.assertShapeMatches({ a: "hi", b: undefined });
    // console.log(obj.accumulator);
    console.log(obj.accumulator.asString());
    // console.log(obj.accumulator);
  });
});
