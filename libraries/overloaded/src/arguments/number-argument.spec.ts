import { describe, it, expect } from "vitest";
import { number } from "./number-argument";

describe("Number Argument", () => {
  describe("assertions", () => {
    describe("assertNumber", () => {
      it("should validate that the value is a number", () => {
        const sut = number("first");
        sut.assertNumber(1);
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should fail validate that the value is a string", () => {
        const sut = number("first");
        sut.assertNumber("hi" as unknown as number);
        expect(sut.accumulator.length).toEqual(1);
        expect(sut.accumulator.asString().trim()).toEqual(
          "Arg[first]: Expected value to be a number but was [string]: hi"
        );
      });
    });
  });
});
