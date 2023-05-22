import { describe, it, expect } from "vitest";
import { array } from "./array-argument";
import { BaseArgument } from "./base-argument";
import { number } from "./number-argument";
import { string } from "./string-argument";

describe("Array Argument", () => {
  describe("validators", () => {
    describe("assertIsArray", () => {
      it("should validate that a value is an array", () => {
        const sut = array([string()]);
        sut.assertIsArray(["hi"]);
        expect(sut.accumulator.length).toBe(0);
      });

      it("should fail validation for a string", () => {
        const sut = array([string()]);
        sut.assertIsArray("hi");
        expect(sut.accumulator.length).toBe(1);
      });

      it("should fail validation for a undefined value", () => {
        const sut = array([string()]);
        sut.assertIsArray(undefined);
        expect(sut.accumulator.length).toBe(1);
      });
    });

    describe("assertPermittedType", () => {
      it("should validate that the array contains known types", () => {
        const sut = array([string(), number()]);
        sut.assertPermittedType(["", 1]);
        expect(sut.accumulator.length).toBe(0);
      });

      it("should fail validation with an unknon element type", () => {
        const sut = array("arr", [string(), number()]);
        sut.assertPermittedType(["", true]);
        expect(sut.accumulator.length).toBe(1);
        expect(sut.accumulator[0]).toEqual(
          `Arg[arr]: Expected array to contain only known types string,number but index [1] contains boolean: 'true'; ["",true]`
        );
      });
    });
    describe("assertEquals", () => {
      it("should validate that the array length equals exactly provided", () => {
        const sut = array([string(), number()], { length: 2 });
        sut.assertLengthEquals(["", 1]);
        expect(sut.accumulator.length).toBe(0);
      });
      it("should validate that the array length equals exactly provided (named)", () => {
        const sut = array("arr", [string(), number()], { length: 2 });
        sut.assertLengthEquals(["", 1]);
        expect(sut.accumulator.length).toBe(0);
      });
      it("should fail validation if the length is too big", () => {
        const sut = array("arr", [string(), number()], { length: 1 });
        sut.assertLengthEquals(["", 1]);
        expect(sut.accumulator.length).toBe(1);
        expect(sut.accumulator[0]).toEqual(
          "Arg[arr]: Expected array to have length 1 but was 2"
        );
      });
      it("should fail validation if the length is too small", () => {
        const sut = array("arr", [string(), number()], { length: 2 });
        sut.assertLengthEquals([""]);
        expect(sut.accumulator.length).toBe(1);
        expect(sut.accumulator[0]).toEqual(
          "Arg[arr]: Expected array to have length 2 but was 1"
        );
      });
    });
    describe("assertLengthGreaterThanMin", () => {
      it("should validate that the array length greater than minimum", () => {
        const sut = array([string(), number()], { minLength: 2 });
        sut.assertLengthGreaterThanMin(["", 1]);
        expect(sut.accumulator.length).toBe(0);
      });
      it("should validate that the array length equals exactly provided (named)", () => {
        const sut = array("arr", [string(), number()], { minLength: 2 });
        sut.assertLengthGreaterThanMin(["", 1]);
        expect(sut.accumulator.length).toBe(0);
      });

      it("should fail validation if the length is too small", () => {
        const sut = array("arr", [string(), number()], { minLength: 2 });
        sut.assertLengthGreaterThanMin([""]);
        expect(sut.accumulator.length).toBe(1);
        expect(sut.accumulator[0]).toEqual(
          "Arg[arr]: Expected value to be an array with min length 2 but was 1"
        );
      });
    });
  });
  describe("assertLengthLessThanMax", () => {
    it("should validate that the array length less than maximum", () => {
      const sut = array([string(), number()], { maxLength: 2 });
      sut.assertLengthLessThanMax(["", 1]);
      expect(sut.accumulator.length).toBe(0);
    });
    it("should validate that the array length equals exactly provided (named)", () => {
      const sut = array("arr", [string(), number()], { maxLength: 2 });
      sut.assertLengthLessThanMax(["", 1]);
      expect(sut.accumulator.length).toBe(0);
    });

    it("should fail validation if the length is too big", () => {
      const sut = array("arr", [string(), number()], { maxLength: 2 });
      sut.assertLengthLessThanMax(["", 1, 1]);
      expect(sut.accumulator.length).toBe(1);
      expect(sut.accumulator[0]).toEqual(
        "Arg[arr]: Expected value to be an array with max length 2 but was 3"
      );
    });
  });
});

describe("array", () => {
  it("should error if no reference is provided", () => {
    const arg = () => array(undefined as unknown as [BaseArgument<string>]);
    expect(arg).toThrow();
  });
  it("should have a name and a reference", () => {
    const arg = array("person", [
      string("firstName"),
      string("secondName"),
      number("age"),
    ]);
    expect(arg.argName).toEqual("person");
    expect(arg.accumulator).empty;
  });
  it("should have a reference", () => {
    const arg = array([
      string("firstName"),
      string("secondName"),
      number("age"),
    ]);
    expect(arg.accumulator).empty;
  });
});
