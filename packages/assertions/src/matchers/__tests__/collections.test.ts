import { describe, expect, it } from "vitest";

import { TestMatcherError, createMatcherContext } from "../../__tests__/helpers/matcher-context";
import {
  assertArrayContaining,
  assertContainEqual,
  assertHasLength,
  assertIterableContaining,
  assertObjectContaining,
} from "../collections";

describe("collection matchers", () => {
  describe("assertObjectContaining", () => {
    it("passes when object contains subset", () => {
      const ctx = createMatcherContext({ id: 1, nested: { flag: true } });
      expect(() => assertObjectContaining(ctx, { nested: { flag: true } })).not.toThrow();
    });

    it("fails when value is not an object", () => {
      const ctx = createMatcherContext<number | undefined>(undefined);
      expect(() => assertObjectContaining(ctx, { id: 1 })).toThrowError(TestMatcherError);
    });

    it("fails when subset does not match", () => {
      const ctx = createMatcherContext({ id: 1, name: "Ada" });
      expect(() => assertObjectContaining(ctx, { id: 2 })).toThrowError(TestMatcherError);
    });

    it("respects negation", () => {
      const ctx = createMatcherContext({ id: 1 }, { negated: true });
      expect(() => assertObjectContaining(ctx, { id: 2 })).not.toThrow();
      expect(() => assertObjectContaining(ctx, { id: 1 })).toThrowError(TestMatcherError);
    });
  });

  describe("assertArrayContaining", () => {
    it("returns the array when elements are present", () => {
      const values = [1, 2, 3];
      const ctx = createMatcherContext(values);
      const result = assertArrayContaining(ctx, [1, 3]);
      expect(result).toBe(values);
    });

    it("fails when array missing elements", () => {
      const ctx = createMatcherContext([1, 2, 3]);
      expect(() => assertArrayContaining(ctx, [4])).toThrowError(TestMatcherError);
    });

    it("throws when value is not array", () => {
      const ctx = createMatcherContext("not array");
      expect(() => assertArrayContaining(ctx, [1])).toThrowError(TestMatcherError);
    });

    it("respects negated expectation", () => {
      const ctx = createMatcherContext([1, 2, 3], { negated: true });
      expect(() => assertArrayContaining(ctx, [4])).not.toThrow();
      expect(() => assertArrayContaining(ctx, [1])).toThrowError(TestMatcherError);
    });
  });

  describe("assertContainEqual", () => {
    it("returns array when element exists", () => {
      const values = [{ id: 1 }, { id: 2 }];
      const ctx = createMatcherContext(values);
      const result = assertContainEqual(ctx, { id: 1 });
      expect(result).toBe(values);
    });

    it("fails when no matching element exists", () => {
      const ctx = createMatcherContext([{ id: 1 }]);
      expect(() => assertContainEqual(ctx, { id: 2 })).toThrowError(TestMatcherError);
    });

    it("respects negation", () => {
      const ctx = createMatcherContext([{ id: 1 }], { negated: true });
      expect(() => assertContainEqual(ctx, { id: 2 })).not.toThrow();
      expect(() => assertContainEqual(ctx, { id: 1 })).toThrowError(TestMatcherError);
    });
  });

  describe("assertIterableContaining", () => {
    it("passes for iterables with items", () => {
      const values = new Set([1, 2, 3]);
      const ctx = createMatcherContext(values);
      const result = assertIterableContaining(ctx, [2, 3]);
      expect(result).toBe(values);
    });

    it("fails when iterable missing entries", () => {
      const ctx = createMatcherContext(new Set([1, 2]));
      expect(() => assertIterableContaining(ctx, [3])).toThrowError(TestMatcherError);
    });

    it("throws when value is not iterable", () => {
      const ctx = createMatcherContext(123);
      expect(() => assertIterableContaining(ctx, [1])).toThrowError(TestMatcherError);
    });

    it("respects negation logic", () => {
      const ctx = createMatcherContext(new Set([1, 2, 3]), { negated: true });
      expect(() => assertIterableContaining(ctx, [4])).not.toThrow();
      expect(() => assertIterableContaining(ctx, [1])).toThrowError(TestMatcherError);
    });
  });

  describe("assertHasLength", () => {
    it("passes and returns length when matched", () => {
      const ctx = createMatcherContext([1, 2, 3]);
      const result = assertHasLength(ctx, 3);
      expect(result).toBe(3);
    });

    it("fails when length mismatches", () => {
      const ctx = createMatcherContext([1, 2, 3]);
      expect(() => assertHasLength(ctx, 2)).toThrowError(TestMatcherError);
    });

    it("fails when value lacks length", () => {
      const ctx = createMatcherContext({});
      expect(() => assertHasLength(ctx, 0)).toThrowError(TestMatcherError);
    });

    it("respects negation for matching length", () => {
      const ctx = createMatcherContext([1, 2, 3], { negated: true });
      expect(() => assertHasLength(ctx, 2)).not.toThrow();
      expect(() => assertHasLength(ctx, 3)).toThrowError(TestMatcherError);
    });
  });
});
