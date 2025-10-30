import { describe, expect, it } from "vitest";
import type { ValidationPath } from "../../core/types";
import { array, instanceOf, intersection, shape, tuple, union } from "../composite";
import { boolean, number, string } from "../primitives";

describe("composite validators", () => {
  const path: ValidationPath = ["arg", 0];

  describe("array", () => {
    it("validates array elements against provided validators", () => {
      const validator = array(string());
      expect(validator.validate(["a", "b"], path).ok).toBe(true);
      expect(validator.validate(["a", 1], path).ok).toBe(false);
    });

    it("enforces length constraints", () => {
      const validator = array(number(), { minLength: 2, maxLength: 3 });
      expect(validator.validate([1, 2], path).ok).toBe(true);
      expect(validator.validate([1], path).ok).toBe(false);
      expect(validator.validate([1, 2, 3, 4], path).ok).toBe(false);
    });

    it("supports exact length checks", () => {
      const validator = array(string(), { length: 2 });
      expect(validator.validate(["a", "b"], path).ok).toBe(true);
      expect(validator.validate(["a"], path).ok).toBe(false);
      expect(validator.validate(["a", "b", "c"], path).ok).toBe(false);
    });
  });

  describe("tuple", () => {
    it("validates element-wise and respects optional entries", () => {
      const optionalString = string({ optional: true });
      const validator = tuple([number(), optionalString]);
      expect(validator.validate([1, "hi"], path).ok).toBe(true);
      expect(validator.validate([1], path).ok).toBe(true);
      expect(validator.validate(["oops"], path).ok).toBe(false);
    });

    it("rejects extra elements when not allowed", () => {
      const validator = tuple([string(), number()]);
      expect(validator.validate(["ok", 1], path).ok).toBe(true);
      expect(validator.validate(["ok", 1, 2], path).ok).toBe(false);
    });
  });

  describe("shape", () => {
    it("validates object properties with optional keys", () => {
      const validator = shape({
        id: number(),
        name: string({ optional: true }),
      });
      expect(validator.validate({ id: 1 }, path).ok).toBe(true);
      expect(validator.validate({ id: 1, name: "ok" }, path).ok).toBe(true);
      expect(validator.validate({ name: "missing" }, path).ok).toBe(false);
    });

    it("rejects unknown properties when not allowed", () => {
      const validator = shape({ id: number() });
      expect(validator.validate({ id: 1 }, path).ok).toBe(true);
      expect(validator.validate({ id: 1, extra: true }, path).ok).toBe(false);
    });

    it("allows unknown properties when configured", () => {
      const validator = shape({ id: number() }, { allowUnknownProperties: true });
      expect(validator.validate({ id: 1, extra: true }, path).ok).toBe(true);
    });
  });

  describe("union", () => {
    it("passes when any underlying validator succeeds", () => {
      const validator = union([string(), number()]);

      expect(validator.validate("ok", path).ok).toBe(true);
      expect(validator.validate(123, path).ok).toBe(true);
      expect(validator.validate(true, path).ok).toBe(false);
    });

    it("aggregates issues when all validators fail", () => {
      const validator = union([string(), number()]);

      const result = validator.validate(false, path);

      expect(result.ok).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("intersection", () => {
    const base = intersection([
      shape({ id: string() }, { allowUnknownProperties: true }),
      shape({ enabled: boolean() }, { allowUnknownProperties: true }),
    ]);

    it("succeeds only when all validators pass", () => {
      expect(base.validate({ id: "abc", enabled: true }, path).ok).toBe(true);
      expect(base.validate({ id: "abc" }, path).ok).toBe(false);
      expect(base.validate({ enabled: true }, path).ok).toBe(false);
    });

    it("reports issues from the failing validator", () => {
      const result = base.validate({ id: "abc" }, path);

      expect(result.ok).toBe(false);
      expect(result.issues.some((issue) => issue.message.includes("Property is required"))).toBe(true);
    });
  });

  describe("instanceOf", () => {
    class Foo {
      constructor(readonly id: number, readonly name: string) {}
    }

    class Bar {}

    it("validates instances of a constructor", () => {
      const validator = instanceOf(Foo);

      expect(validator.validate(new Foo(1, "foo"), path).ok).toBe(true);
      expect(validator.validate(new Bar(), path).ok).toBe(false);
    });

    it("chains an inner validator when provided", () => {
      const validator = instanceOf(Foo, shape({ id: number() }, { allowUnknownProperties: true }));

      expect(validator.validate(new Foo(2, "foo"), path).ok).toBe(true);
      expect(validator.validate(new Foo("nope" as unknown as number, "foo"), path).ok).toBe(false);
    });

    it("respects optional instances", () => {
      const validator = instanceOf(Foo, undefined, { optional: true });

      expect(validator.validate(undefined, path).ok).toBe(true);
    });
  });
});
