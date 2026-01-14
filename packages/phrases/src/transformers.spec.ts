import { describe, expect, it } from "vitest";
import {
  camel,
  pascal,
  snake,
  constant,
  capital,
  kebab,
  lower,
  upper,
  trim,
  collapse,
  prefix,
  suffix,
} from "./transformers";

describe("transformers", () => {
  const sample = "test phrase";

  function run(factory: ReturnType<typeof camel>) {
    return factory.apply(sample);
  }

  it("camel", () => {
    expect(run(camel())).toEqual("testPhrase");
  });

  it("pascal", () => {
    expect(run(pascal())).toEqual("TestPhrase");
  });

  it("snake", () => {
    expect(run(snake())).toEqual("test_phrase");
  });

  it("constant", () => {
    expect(run(constant())).toEqual("TEST_PHRASE");
  });

  it("capital", () => {
    expect(run(capital())).toEqual("Test Phrase");
  });

  it("kebab", () => {
    expect(run(kebab())).toEqual("test-phrase");
  });

  it("lower", () => {
    expect(run(lower())).toEqual("test phrase");
  });

  it("upper", () => {
    expect(run(upper())).toEqual("TEST PHRASE");
  });

  it("trim removes whitespace", () => {
    const factory = trim();
    expect(factory.apply(" spaced value ")).toEqual("spacedvalue");
  });

  it("collapse removes repeated whitespace", () => {
    const factory = collapse();
    expect(factory.apply("a  b\n c")).toEqual("abc");
  });

  it("prefix works with strings", () => {
    const factory = prefix("get");
    expect(factory().apply("value")).toEqual("get value");
  });

  it("prefix works with template literals", () => {
    const factory = prefix`get`;
    expect(factory().apply("value")).toEqual("get value");
  });

  it("suffix works with strings", () => {
    const factory = suffix("result");
    expect(factory().apply("value")).toEqual("value result");
  });

  it("suffix works with template literals", () => {
    const factory = suffix`result`;
    expect(factory().apply("value")).toEqual("value result");
  });
});
