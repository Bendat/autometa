import { describe, it, expect } from "vitest";
import { convertPhrase } from "./convert-phrase";
import {
  camel,
  capital,
  constant,
  kebab,
  pascal,
  pfx,
  sfx,
  snake
} from "./string-transformer";
import { CurriedFromPhraseFunction, FromPhraseFunction } from "./types";
import { PhraseParser } from "./from-phrase";

describe("Convert Phrase", () => {
  describe("camelCase", () => {
    it("should convert a phrase to camel case", () => {
      const conversion = convertPhrase("test phrase", camel);
      expect(conversion).toEqual("testPhrase");
    });
    it('should convert a phrase to camel case with a "the" prefix', () => {
      const conversion = convertPhrase("test phrase", camel, pfx`the`);
      expect(conversion).toEqual("theTestPhrase");
    });
    it('should convert a phrase to camel case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", camel, sfx`bar`);
      expect(conversion).toEqual("testPhraseBar");
    });
    it('should convert a phrase to camel case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        camel,
        pfx`the`,
        sfx`bar`
      );
      expect(conversion).toEqual("theTestPhraseBar");
    });
  });
  describe("PascalCase", () => {
    it("should convert a phrase to pascal case", () => {
      const conversion = convertPhrase("test phrase", pascal);
      expect(conversion).toEqual("TestPhrase");
    });
    it('should convert a phrase to pascal case with a "the" prefix', () => {
      const conversion = convertPhrase("test phrase", pascal, pfx`the`);
      expect(conversion).toEqual("TheTestPhrase");
    });
    it('should convert a phrase to pascal case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", pascal, sfx`bar`);
      expect(conversion).toEqual("TestPhraseBar");
    });
    it('should convert a phrase to pascal case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        pascal,
        pfx`the`,
        sfx`bar`
      );
      expect(conversion).toEqual("TheTestPhraseBar");
    });
  });
  describe("snake_case", () => {
    it("should convert a phrase to snake case", () => {
      const conversion = convertPhrase("test phrase", snake);
      expect(conversion).toEqual("test_phrase");
    });
    it('should convert a phrase to snake case with a "the" prefix', () => {
      const conversion = convertPhrase("test phrase", snake, pfx`the`);
      expect(conversion).toEqual("the_test_phrase");
    });
    it('should convert a phrase to snake case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", snake, sfx`bar`);
      expect(conversion).toEqual("test_phrase_bar");
    });
    it('should convert a phrase to snake case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        snake,
        pfx`the`,
        sfx`bar`
      );
      expect(conversion).toEqual("the_test_phrase_bar");
    });
  });
  describe("kebab-case", () => {
    it("should convert a phrase to kebab case", () => {
      const conversion = convertPhrase("test phrase", kebab);
      expect(conversion).toEqual("test-phrase");
    });
    it('should convert a phrase to kebab case with a "the" prefix', () => {
      const conversion = convertPhrase("test phrase", kebab, pfx`the`);
      expect(conversion).toEqual("the-test-phrase");
    });
    it('should convert a phrase to kebab case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", kebab, sfx`bar`);
      expect(conversion).toEqual("test-phrase-bar");
    });
    it('should convert a phrase to kebab case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        kebab,
        pfx`the`,
        sfx`bar`
      );
      expect(conversion).toEqual("the-test-phrase-bar");
    });
  });
  describe("CONSTANT_CASE", () => {
    it("should convert a phrase to constant case", () => {
      const conversion = convertPhrase("test phrase", constant);
      expect(conversion).toEqual("TEST_PHRASE");
    });
    it('should convert a phrase to constant case with a "the" prefix', () => {
      const conversion = convertPhrase("test phrase", constant, pfx`the`);
      expect(conversion).toEqual("THE_TEST_PHRASE");
    });
    it('should convert a phrase to constant case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", constant, sfx`bar`);
      expect(conversion).toEqual("TEST_PHRASE_BAR");
    });
    it('should convert a phrase to constant case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        constant,
        pfx`the`,
        sfx`bar`
      );
      expect(conversion).toEqual("THE_TEST_PHRASE_BAR");
    });
  });
  describe("Capital Case", () => {
    it("should convert a phrase to capital case", () => {
      const conversion = convertPhrase("test phrase", capital);
      expect(conversion).toEqual("Test Phrase");
    });
    it('should convert a phrase to capital case with a "the" prefix', () => {
      const conversion = convertPhrase("test phrase", capital, pfx`the`);
      expect(conversion).toEqual("The Test Phrase");
    });
    it('should convert a phrase to capital case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", capital, sfx`bar`);
      expect(conversion).toEqual("Test Phrase Bar");
    });
    it('should convert a phrase to capital case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        capital,
        pfx`the`,
        sfx`bar`
      );
      expect(conversion).toEqual("The Test Phrase Bar");
    });
  });
});

@PhraseParser
class Foo {
  hi = "hello";
  declare fromPhrase: CurriedFromPhraseFunction;
}
it("should add FromPhrase to a class prototype", () => {
  const foo = new Foo();
  expect(foo.fromPhrase("hi")).toEqual("hello");
});
