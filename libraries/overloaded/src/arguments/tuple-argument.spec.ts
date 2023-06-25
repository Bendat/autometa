import { AnyArg } from "../types";
import { describe, it, expect } from "vitest";
import { BaseArgument } from "./base-argument";
import { number } from "./number-argument";
import { string } from "./string-argument";
import { tuple } from "./tuple-argument";

describe("Tuple Argument", () => {
  describe("Validators", () => {
    describe("assertIsTuple", () => {
      it("should add an error to the accumulator if the tuple is not an array type", () => {
        const tup = tuple("tuple", [string("a")] as unknown as [AnyArg]);
        tup.validate("");
        expect(tup.accumulator.length).toEqual(1);
      });
      it("should not add an error to the accumulator if the tuple is an array type", () => {
        const tup = tuple([string(), number()]);
        tup.validate(["", 1]);
        expect(tup.accumulator.length).toEqual(0);
      });
    });
    describe("assertPermittedTypes", () => {
      it("should add an error to the accumulator if the tuple contents do not match", () => {
        const tup = tuple("tuple", [string(), number()] as unknown as [AnyArg]);
        tup.validate(["", ""]);
        expect(tup.accumulator.length).toEqual(2);
      });
      it("should not add an error to the accumulator if the tuple contents match", () => {
        const tup = tuple([string(), number()]);
        tup.validate(["", 1]);
        expect(tup.accumulator.length).toEqual(0);
      });
    });
    describe("validate", () => {
      it("should return true when the tuple is valid", () => {
        const tup = tuple([string(), number()]);
        tup.validate(["", 1]);
        expect(tup.accumulator.length).toEqual(0);
      });
    });
  });
});

describe("tuple", () => {
  it("should error if no reference is provided", () => {
    const arg = () => tuple(undefined as unknown as [BaseArgument<string>]);
    expect(arg).toThrow();
  });
  it("should have a name and a reference", () => {
    const arg = tuple("person", [
      string("firstName"),
      string("secondName"),
      number("age"),
    ]);
    expect(arg.argName).toEqual("person");
    expect(arg.accumulator).empty;
  });
  it("should have a reference", () => {
    const arg = tuple([
      string("firstName"),
      string("secondName"),
      number("age"),
    ]);
    expect(arg.accumulator).empty;
  });
});
