import { describe, expect, it } from "vitest";

import { hasLengthProperty, isIterable, isRecord } from "../predicates";

describe("predicates", () => {
  describe("isRecord", () => {
    it("returns true for objects", () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord(Object.create(null))).toBe(true);
    });

    it("returns false for non-objects", () => {
      expect(isRecord(null)).toBe(false);
      expect(isRecord(42)).toBe(false);
      expect(isRecord("string")).toBe(false);
    });
  });

  describe("isIterable", () => {
    it("returns true for iterables", () => {
      expect(isIterable([1, 2, 3])).toBe(true);
      expect(isIterable(new Set([1]))).toBe(true);
      expect(isIterable(new Map())).toBe(true);
    });

    it("returns false for non-iterables", () => {
      expect(isIterable(123)).toBe(false);
      expect(isIterable({})).toBe(false);
      expect(isIterable(undefined)).toBe(false);
    });
  });

  describe("hasLengthProperty", () => {
    it("returns true when length is numeric", () => {
      expect(hasLengthProperty([1, 2, 3])).toBe(true);
      expect(hasLengthProperty({ length: 3 })).toBe(true);
    });

    it("returns false otherwise", () => {
      expect(hasLengthProperty({ length: "3" })).toBe(false);
      expect(hasLengthProperty(42)).toBe(false);
      expect(hasLengthProperty({})).toBe(false);
    });
  });
});
