import { describe, expect, it } from "vitest";
import { convertPhrase } from "./convert-phrase";
import { camel, kebab, prefix, suffix, snake } from "./transformers";
import type { PhraseTransformFactory } from "./types";

describe("convertPhrase", () => {
  it("applies provided transforms in order", () => {
    const result = convertPhrase("test string", camel);
    expect(result).toEqual("testString");
  });

  it("normalises whitespace before applying transforms", () => {
    const result = convertPhrase("  Example\tphrase\n ", kebab);
    expect(result).toEqual("example-phrase");
  });

  it("supports prefix and suffix helpers", () => {
    const result = convertPhrase(
      "user name",
      prefix`get`,
      camel,
      suffix`request`
    );

    expect(result).toEqual("getUserName request");
  });

  it("allows composing arbitrary factories", () => {
    const stripVowels: PhraseTransformFactory = () => ({
      name: "strip-vowels",
      apply: (value) => value.replace(/[aeiou]/gi, ""),
      kind: "custom",
    });

    expect(convertPhrase("hello world", snake, stripVowels)).toEqual(
      "hll_wrld"
    );
  });

  it("throws when provided factory is not a function", () => {
    const invalidFactory = null as unknown as PhraseTransformFactory;
    expect(() => convertPhrase("foo", invalidFactory)).toThrow(
      /not a factory function/i
    );
  });

  it("throws when a transform returns a non-string value", () => {
    const invalid: PhraseTransformFactory = () => ({
      name: "invalid",
      apply: () => null as unknown as string,
    });

    expect(() => convertPhrase("foo", invalid)).toThrow(
      /did not return a string/i
    );
  });

  it("returns the original phrase when no transforms are supplied", () => {
    const phrase = "no changes";
    expect(convertPhrase(phrase)).toBe(phrase);
  });
});
