import { describe, expect, it } from "vitest";
import {
  AddPhraseImpl,
  FromPhrase,
  IFromPhrase,
  assertPhrase,
  from,
  isPhrase,
} from "../from-phrase";
import { camel } from "../transformers";

describe("from-phrase helpers", () => {
  class Example {
    firstName = "Ada";
    lastName = "Lovelace";
  }

  it("exposes a converter for objects via from()", () => {
    const instance = new Example();
    const accessor = from(instance);

    expect(accessor.byPhrase("first name", camel)).toBe("Ada");
  });

  it("determines whether a phrase maps to a property", () => {
    const instance = new Example();

    expect(isPhrase(instance, "first name", camel)).toBe(true);
    expect(isPhrase(instance, "unknown", camel)).toBe(false);
  });

  it("asserts when the phrase does not resolve", () => {
    const instance = new Example();

    expect(() => assertPhrase(instance, "unknown", camel)).toThrow();
    expect(() => assertPhrase(instance, "first name", camel)).not.toThrow();
  });

  it("attaches fromPhrase lazily with AddPhraseImpl", () => {
    const base = { displayName: "Ada" };
    const enhanced = AddPhraseImpl(base);

    const descriptor = Object.getOwnPropertyDescriptor(enhanced, "fromPhrase");
    expect(descriptor?.enumerable).toBe(false);

    expect(enhanced.fromPhrase("display name", camel)).toBe("Ada");
  });

  it("honours custom converter passed to AddPhraseImpl", () => {
    const base = {} as Record<string, unknown>;
    const custom = (key: string) => key.toUpperCase();
    const enhanced = AddPhraseImpl(base, custom);

    expect(enhanced.fromPhrase).toBe(custom);
    expect(enhanced.fromPhrase("value")).toEqual("VALUE");
  });

  it("decorates classes with FromPhrase", () => {
    class Decorated {
      valueOne = 42;
      declare fromPhrase: IFromPhrase;
    }

    FromPhrase(Decorated);
    const instance = new Decorated();

    expect(instance.fromPhrase("value one", camel)).toBe(42);
  });
});
