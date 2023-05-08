import { describe, it, expect } from "vitest";
import { string, StringArgument } from "./string-argument";

describe("StringArgument", () => {
  it("should create a new StepArgument with no name and no options", () => {
    const args = new StringArgument().withIndex(1);
    expect(args.argName).toEqual(undefined);
    expect(args.options).toEqual(undefined);
    expect(args.index).toEqual(1);
  });
  it("should create a new StepArgument with a name and no options", () => {
    const args = new StringArgument(["name"]).withIndex(1);
    expect(args.argName).toEqual("name");
    expect(args.options).toEqual(undefined);
    expect(args.index).toEqual(1);
  });
  it("should create a new StepArgument with options and no name", () => {
    const args = new StringArgument([{ equals: "foo" }]).withIndex(1);
    expect(args.argName).toEqual(undefined);
    expect(args.options).toEqual({ equals: "foo" });
    expect(args.index).toEqual(1);
  });
  it("should create a new StepArgument with a name and options", () => {
    const args = new StringArgument(["fred", { equals: "foo" }]).withIndex(1);
    expect(args.argName).toEqual("fred");
    expect(args.options).toEqual({ equals: "foo" });
    expect(args.index).toEqual(1);
  });
  it("should have a string identifier", () => {
    const args = new StringArgument(["fred", { equals: "foo" }]).withIndex(1);
    expect(args.identifier).toEqual("fred");
  });
  it("should have a index identifier", () => {
    const args = new StringArgument([{ equals: "foo" }]).withIndex(1);
    expect(args.identifier).toEqual(1);
  });
  describe("validators", () => {
    const sut = new StringArgument();
    describe("is string", () => {
      it("should do nothing if the value is a string", () => {
        expect(sut.assertString("1234")).toEqual(true);
      });
      it("should throw an error if the value is not a string", () => {
        expect(sut.assertString(1 as unknown as string)).toEqual(false);
      });
    });
    describe("is equal", () => {
      it("should do nothing if the values are equal", () => {
        expect(sut.assertStringEquals("1234", "1234")).toEqual(true);
      });
      it("should throw an error if the values are not equal", () => {
        expect(sut.assertStringEquals("1234", "4321")).toEqual(false);
      });
    });
    describe("is less than max", () => {
      it("should do nothing if the value length is less than the max length", () => {
        expect(sut.assertStringLessThanMax("1234", 5)).toEqual(true);
      });
      it("should throw an error if the value length is greater than the max length", () => {
        expect(sut.assertStringLessThanMax("1234", 2)).toEqual(false);
      });
    });

    describe("is greater than min", () => {
      it("should do nothing if the value length is greater than the min length", () => {
        expect(sut.assertStringGreaterThanMin("1234", 2)).toEqual(true);
      });
      it("should throw an error if the value length is less than the min length", () => {
        expect(sut.assertStringGreaterThanMin("1234", 5)).toEqual(false);
      });
    });
    describe("is substring in value", () => {
      it("should do nothing if the value has the substring", () => {
        expect(sut.assertStringIncludes("1234", "123")).toEqual(true);
      });
      it("should throw an error if the value does not have the substring", () => {
        expect(sut.assertStringIncludes("1234", "foo")).toEqual(false);
      });
    });
    describe("is value in list", () => {
      it("should do nothing if the value is in the array", () => {
        expect(sut.assertStringIn("1234", ["1234"])).toEqual(true);
      });
      it("should throw an error if the value is not included in the array", () => {
        expect(sut.assertStringIn("1234", [])).toEqual(false);
      });
    });
  });
});

describe("string validator", () => {
  it("should throw a paring error", () => {
    expect(() => string(1 as unknown as string)).toThrow();
  });
});
