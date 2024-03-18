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
  snake,
  trim,
} from "./string-transformer";
import { CurriedFromPhraseFunction } from "./types";
import { PhraseParser } from "./from-phrase";

describe("Convert Phrase", () => {
  describe("camelCase", () => {
    it("should convert a phrase to camel case", () => {
      const conversion = convertPhrase("test phrase", camel);
      expect(conversion).toEqual("testPhrase");
    });
    it('should convert a phrase to camel case with a "the" prefix', () => {
      const conversion = convertPhrase("test phrase", pfx`the`, camel);
      expect(conversion).toEqual("theTestPhrase");
    });
    it('should convert a phrase to camel case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", sfx`bar`, camel);
      expect(conversion).toEqual("testPhraseBar");
    });
    it('should convert a phrase to camel case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        pfx`the`,
        sfx`bar`,
        camel
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
      const conversion = convertPhrase("test phrase", pfx`the`, pascal);
      expect(conversion).toEqual("TheTestPhrase");
    });
    it('should convert a phrase to pascal case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", sfx`bar`, pascal);
      expect(conversion).toEqual("TestPhraseBar");
    });
    it('should convert a phrase to pascal case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        pfx`the`,
        sfx`bar`,
        pascal
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
      const conversion = convertPhrase("test phrase", pfx`the`, snake);
      expect(conversion).toEqual("the_test_phrase");
    });
    it('should convert a phrase to snake case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", sfx`bar`, snake);
      expect(conversion).toEqual("test_phrase_bar");
    });
    it('should convert a phrase to snake case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        pfx`the`,
        sfx`bar`,
        snake
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
      const conversion = convertPhrase("test phrase", pfx`the`, kebab);
      expect(conversion).toEqual("the-test-phrase");
    });
    it('should convert a phrase to kebab case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", sfx`bar`, kebab);
      expect(conversion).toEqual("test-phrase-bar");
    });
    it('should convert a phrase to kebab case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        pfx`the`,
        sfx`bar`,
        kebab
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
      const conversion = convertPhrase("test phrase", pfx`the`, constant);
      expect(conversion).toEqual("THE_TEST_PHRASE");
    });
    it('should convert a phrase to constant case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", sfx`bar`, constant);
      expect(conversion).toEqual("TEST_PHRASE_BAR");
    });
    it('should convert a phrase to constant case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        pfx`the`,
        sfx`bar`,
        constant
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
      const conversion = convertPhrase("test phrase", pfx`the`, capital);
      expect(conversion).toEqual("The Test Phrase");
    });
    it('should convert a phrase to capital case with a "bar" suffix', () => {
      const conversion = convertPhrase("test phrase", sfx`bar`, capital);
      expect(conversion).toEqual("Test Phrase Bar");
    });
    it('should convert a phrase to capital case with a "the" prefix and "bar" suffix', () => {
      const conversion = convertPhrase(
        "test phrase",
        pfx`the`,
        sfx`bar`,
        capital
      );
      expect(conversion).toEqual("The Test Phrase Bar");
    });
  });
});

describe("mixing cases", () => {
  it("should create a mixed case string", () => {
    const conversion = convertPhrase(
      "test phrase",
      pascal,
      pfx`the`,
      camel,
      sfx`_`,
      sfx`Bar`,
      sfx("_"),
      trim
    );
    expect(conversion).toEqual("theTestPhrase_Bar_");
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
