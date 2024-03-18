import { describe, it, expect } from "vitest";
import { TypeArgument } from "./type-argument";
class Foo {}
describe("TypeArgument", () => {
  describe("Validators", () => {
    describe("assertType", () => {
      it("should add an error to the accumulator if the type is not a match", () => {
        const arg = new TypeArgument(Foo);
        arg.validate("");
        expect(arg.accumulator.length).toEqual(1);
      });
      it("should not add an error to the accumulator if the type is a match", () => {
        const arg = new TypeArgument(Foo);
        arg.validate(Foo);
        expect(arg.accumulator.length).toEqual(0);
      });
    });
  });
});
