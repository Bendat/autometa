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
    describe("is string", () => {
      it("should do nothing if the value is a string", () => {
        const sut = new StringArgument();
        sut.assertString("1234");
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should throw an error if the value is not a string", () => {
        const sut = new StringArgument();
        sut.assertString(1);
        expect(sut.accumulator.length).toEqual(1);
      });
    });
    describe("is equal", () => {
      it("should do nothing if the values are equal", () => {
        const sut = new StringArgument([{ equals: "1234" }]);
        sut.assertStringEquals("1234");
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should throw an error if the values are not equal", () => {
        const sut = new StringArgument([{ equals: "1234" }]);
        sut.assertStringEquals("12345");
        expect(sut.accumulator.length).toEqual(1);
      });
    });
    describe("is less than max", () => {
      it("should do nothing if the value length is less than the max length", () => {
        const sut = new StringArgument([{ maxLength: 5 }]);
        sut.assertStringLessThanMax("1234");
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should do nothing if the value length is less than the max length", () => {
        const sut = new StringArgument([{ maxLength: 5 }]);
        sut.assertStringLessThanMax("12345");
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should throw an error if the value length is greater than the max length", () => {
        const sut = new StringArgument([{ maxLength: 5 }]);
        sut.assertStringLessThanMax("123456");
        expect(sut.accumulator.length).toEqual(1);
      });
    });

    describe("is greater than min", () => {
      it("should do nothing if the value length is greater than the min length", () => {
        const sut = new StringArgument([{ minLength: 1 }]);
        sut.assertStringGreaterThanMin("1");
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should throw an error if the value length is less than the min length", () => {
        const sut = new StringArgument([{ minLength: 1 }]);
        sut.assertStringGreaterThanMin("");
        expect(sut.accumulator.length).toEqual(1);
      });
    });
    describe("is substring in value", () => {
      it("should do nothing if the value has the substring", () => {
        const sut = new StringArgument([{ includes: "lo" }]);
        sut.assertStringIncludes("hollow");
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should throw an error if the value does not have the substring", () => {
        const sut = new StringArgument([{ includes: "lat" }]);
        sut.assertStringIncludes("hollow");
        expect(sut.accumulator.length).toEqual(1);
      });
    });
    describe("is value in list", () => {
      it("should do nothing if the value is in the array", () => {
        const sut = new StringArgument([{ in: ["a", "b"] }]);
        sut.assertStringIn("a");
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should throw an error if the value is not included in the array", () => {
        const sut = new StringArgument([{ in: ["a", "b"] }]);
        sut.assertStringIn("c");
        expect(sut.accumulator.length).toEqual(1);
      });
    });
  });
});

describe("string validator", () => {
  it("should throw a paring error", () => {
    expect(() => string(1 as unknown as string)).toThrow();
  });
});
