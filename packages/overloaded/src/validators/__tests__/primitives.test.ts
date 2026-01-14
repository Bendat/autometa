import { describe, expect, it } from "vitest";
import type { ValidationPath } from "../../core/types";
import { boolean, func, literal, number, string, typeOf, unknown } from "../primitives";

describe("primitive validators", () => {
  const path: ValidationPath = ["arg", 0];

  describe("string", () => {
    it("accepts plain strings", () => {
      const validator = string();
      expect(validator.validate("hello", path).ok).toBe(true);
      expect(validator.validate(1, path).ok).toBe(false);
    });

    it("enforces length and pattern constraints", () => {
      const validator = string({ minLength: 2, maxLength: 4, pattern: /^ab/ });
      expect(validator.validate("ab", path).ok).toBe(true);
      expect(validator.validate("a", path).ok).toBe(false);
      expect(validator.validate("abcde", path).ok).toBe(false);
      expect(validator.validate("zz", path).ok).toBe(false);
    });

    it("uses predicate when provided", () => {
      const validator = string({ predicate: (value) => value === "ok" });
      expect(validator.validate("ok", path).ok).toBe(true);
      expect(validator.validate("nope", path).ok).toBe(false);
    });
  });

  describe("number", () => {
    it("accepts numbers and rejects other types", () => {
      const validator = number();
      expect(validator.validate(42, path).ok).toBe(true);
      expect(validator.validate("42", path).ok).toBe(false);
    });

    it("validates integer, finite, min and max options", () => {
      const validator = number({ integer: true, finite: true, min: 0, max: 10 });
      expect(validator.validate(5, path).ok).toBe(true);
      expect(validator.validate(5.5, path).ok).toBe(false);
      expect(validator.validate(Number.POSITIVE_INFINITY, path).ok).toBe(false);
      expect(validator.validate(-1, path).ok).toBe(false);
      expect(validator.validate(11, path).ok).toBe(false);
    });

    it("supports predicate checks", () => {
      const validator = number({ predicate: (value) => value % 2 === 0 });
      expect(validator.validate(4, path).ok).toBe(true);
      expect(validator.validate(3, path).ok).toBe(false);
    });
  });

  describe("boolean", () => {
    it("matches boolean values", () => {
      const validator = boolean();
      expect(validator.validate(true, path).ok).toBe(true);
      expect(validator.validate(false, path).ok).toBe(true);
      expect(validator.validate("true", path).ok).toBe(false);
    });
  });

  describe("literal", () => {
    it("matches a single literal value", () => {
      const validator = literal("ok");
      expect(validator.validate("ok", path).ok).toBe(true);
      expect(validator.validate("no", path).ok).toBe(false);
    });

    it("matches any value in a literal union", () => {
      const validator = literal(["a", "b", "c"]);
      expect(validator.validate("b", path).ok).toBe(true);
      expect(validator.validate("z", path).ok).toBe(false);
    });

    it("handles numeric and boolean literals", () => {
      const validator = literal([1, 2, true]);
      expect(validator.validate(2, path).ok).toBe(true);
      expect(validator.validate(true, path).ok).toBe(true);
      expect(validator.validate(false, path).ok).toBe(false);
    });
  });

  describe("unknown", () => {
    it("always succeeds", () => {
      const validator = unknown();
      expect(validator.validate("anything", path).ok).toBe(true);
      expect(validator.validate(123, path).ok).toBe(true);
    });
  });

  describe("func", () => {
    it("accepts functions and rejects other types", () => {
      const validator = func();
      expect(validator.validate(() => undefined, path).ok).toBe(true);
      expect(validator.validate(42, path).ok).toBe(false);
    });

    it("enforces arity when provided", () => {
      const validator = func({ arity: 2 });
      expect(validator.validate((a: unknown, b: unknown) => [a, b], path).ok).toBe(true);
      expect(validator.validate((a: unknown) => a, path).ok).toBe(false);
    });
  });

  describe("typeOf", () => {
    class Foo {}

    it("matches exact constructor references", () => {
      const validator = typeOf(Foo);
      expect(validator.validate(Foo, path).ok).toBe(true);
      class Bar {}
      expect(validator.validate(Bar, path).ok).toBe(false);
    });

    it("respects optional configuration", () => {
      const validator = typeOf(Foo, { optional: true });
      expect(validator.validate(undefined, path).ok).toBe(true);
    });
  });
});
