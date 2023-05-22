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
    describe("assertNumberEquals", () => {
      it("should validate that the value equals a number", () => {
        const sut = number("first", { equals: 1 });
        sut.assertNumberEquals(1);
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should fail validate that the value does not equal", () => {
        const sut = number("first", { equals: 0 });
        sut.assertNumberEquals(1);
        expect(sut.accumulator.length).toEqual(1);
        expect(sut.accumulator.asString().trim()).toEqual(
          "Arg[first]: Expected 1 to equal 0 but did not."
        );
      });
    });
    describe("assertNumberLessThanMax", () => {
      it("should validate that the value is less than max", () => {
        const sut = number("first", { max: 1 });
        sut.assertNumberLessThanMax(1);
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should fail validate that the value is greater than max", () => {
        const sut = number("first", { max: 0 });
        sut.assertNumberLessThanMax(1);
        expect(sut.accumulator.length).toEqual(1);
        expect(sut.accumulator.asString().trim()).toEqual(
          "Arg[first]: Expected number 1 to be less than max value 0"
        );
      });
    });
    describe("assertNumberGreaterThanMin", () => {
      it("should validate that the value is at least 1", () => {
        const sut = number("first", { min: 1 });
        sut.assertNumberGreaterThanMin(1);
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should fail validate that the value is greater than 1", () => {
        const sut = number("first", { min: 1 });
        sut.assertNumberGreaterThanMin(0);
        expect(sut.accumulator.length).toEqual(1);
        expect(sut.accumulator.asString().trim()).toEqual(
          "Arg[first]: Expected number to be greater than minimum value 1"
        );
      });
    });

    describe("assertTypes", () => {
      it("should validate that the value is a float", () => {
        const sut = number("first", { type: "float" });
        sut.assertType(1.5);
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should fail to validate that the value is a float", () => {
        const sut = number("first", { type: "float" });
        sut.assertType(0);
        expect(sut.accumulator.length).toEqual(1);

        expect(sut.accumulator.asString().trim()).toEqual(
          "Arg[first]: Expected number '0' to be a float but was an integer"
        );
      });
      it("should validate that the value is a float", () => {
        const sut = number("first", { type: "float" });
        sut.assertType(1.5);
        expect(sut.accumulator.length).toEqual(0);
      });
    });
  });
});
