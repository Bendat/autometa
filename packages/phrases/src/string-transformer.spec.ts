import { describe, it, expect } from "vitest";
import {
  CamelCaseTransformer,
  ConstantCaseTransformer,
  PascalCaseTransformer,
  SnakeCaseTransformer,
  camel,
  constant,
  pascal,
  pfx,
  sfx,
  snake,
} from "./string-transformer";

describe("StringTransformer", () => {
  it("Should convert a string to camel case", () => {
    const sut = new CamelCaseTransformer();
    expect(sut.transform("test string")).toEqual("testString");
  });
  it("should convert to snake case", () => {
    const sut = new SnakeCaseTransformer();
    expect(sut.transform("test string")).toEqual("test_string");
  });
  it("should convert to PascalCase", () => {
    const sut = new PascalCaseTransformer();
    expect(sut.transform("test string")).toEqual("TestString");
  });

  it("should convert to constant case", () => {
    const sut = new ConstantCaseTransformer();
    expect(sut.transform("test string")).toEqual("TEST_STRING");
  });
  it("should convert to capital case", () => {
    const sut = new PascalCaseTransformer();
    expect(sut.transform("test string")).toEqual("TestString");
  });
});

describe("factories", () => {
  it("should create a camel case transformer", () => {
    const sut = camel();
    expect(sut).toBeInstanceOf(CamelCaseTransformer);
  });
  it("should create a pascal case transformer", () => {
    const sut = pascal();
    expect(sut).toBeInstanceOf(PascalCaseTransformer);
  });
  it("should create a snake case transformer", () => {
    const sut = snake();
    expect(sut).toBeInstanceOf(SnakeCaseTransformer);
  });
  it("should create a constant case transformer", () => {
    const sut = constant();
    expect(sut).toBeInstanceOf(ConstantCaseTransformer);
  });
  it("should create a prefix transformer", () => {
    const sut = pfx`test`();
    expect(sut.transform("string")).toEqual("test string");
  });
  it("should create a prefix transformer", () => {
    const sut = sfx`test`();
    expect(sut.transform("string")).toEqual("string test");
  });
});
