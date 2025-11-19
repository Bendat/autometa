import { describe, expect, expectTypeOf, it } from "vitest";

import { EnsureError, ensure } from "../index";

class CustomError extends Error {
  public readonly flag = true;
}

describe("ensure", () => {
  it("returns the original value", () => {
    const chain = ensure(42);
    expect(chain.value).toBe(42);
  });

  it("supports toBe with Object.is semantics", () => {
    const value = {};
    const chain = ensure(value).toBe(value);
    expect(chain.value).toBe(value);
  });

  it("supports toEqual for deep equality", () => {
    const left = { nested: { value: [1, 2, 3] } };
    const right = { nested: { value: [1, 2, 3] } };

    const chain = ensure(left).toEqual(right);
    expect(chain.value).toBe(left);
  });

  it("narrows type after toBeDefined", () => {
    const maybe: string | undefined = "defined";
    const chain = ensure(maybe).toBeDefined();
    expect(chain.value).toBe(maybe);
    expectTypeOf(chain.value).toEqualTypeOf<string>();
  });

  it("narrows array type after toBeArrayContaining", () => {
    const maybeValues: readonly number[] | Set<number> = [1, 2, 3];
    const chain = ensure(maybeValues).toBeArrayContaining([1]);
    const result = chain.value;
    const acceptsReadonly: readonly number[] = result;
    expect(acceptsReadonly).toBe(result);
    // @ts-expect-error Set is not assignable after narrowing
    const invalid: typeof result = new Set<number>();
    void invalid;
  });

  it("throws EnsureError when toBeDefined fails", () => {
    expect(() => ensure<string | null>(null).toBeDefined()).toThrowError(EnsureError);
  });

  it("narrows type after toBeInstanceOf", () => {
    const error: Error | CustomError = new CustomError("boom");
    const chain = ensure(error).toBeInstanceOf(CustomError);
    expect(chain.value.flag).toBe(true);
    expectTypeOf(chain.value).toEqualTypeOf<CustomError>();
  });

  it("asserts object partial matches", () => {
    const actual = { id: 1, name: "Test", nested: { active: true } };
    const shape = { name: "Test", nested: { active: true } };

    const chain = ensure(actual).toBeObjectContaining(shape);
    expect(chain.value).toBe(actual);
  });

  it("reports aggregated mismatches for object containing", () => {
    try {
      ensure({ id: 1, name: "Example" }).toBeObjectContaining({ id: 2, active: true });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnsureError);
      const message = (error as EnsureError).message;
      expect(message).toContain("ensure(received).toBeObjectContaining(expected)");
      expect(message).toContain("Object does not match the provided subset");
      expect(message).toContain("Expected:");
      expect(message).toContain("Received:");
    }
  });

  it("asserts array contains provided elements", () => {
    const values = [1, { label: "item" }, 3];
    const chain = ensure(values).toBeArrayContaining([{ label: "item" }]);
    expect(chain.value).toBe(values);
  });

  it("throws when array is missing required element", () => {
    try {
      ensure([1, 2, 3]).toBeArrayContaining([4]);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnsureError);
      expect((error as EnsureError).message).toContain("Array is missing expected elements");
      expect((error as EnsureError).message).toContain("Missing elements:");
    }
  });

  it("throws when value is not an array", () => {
    expect(() => ensure("not array").toBeArrayContaining(["n/a"])).toThrowError(EnsureError);
  });

  it("validates arrays contain deep equal elements", () => {
    const chain = ensure([1, { nested: true }]).toContainEqual({ nested: true });
    expect(chain.value).toEqual([1, { nested: true }]);
  });

  it("asserts iterables contain expected values", () => {
    const set = new Set([1, 2, 3]);
    const chain = ensure(set).toBeIterableContaining([2, 3]);
    expect(chain.value).toBe(set);
  });

  it("throws when iterable misses values", () => {
    expect(() => ensure(new Set([1, 2])).toBeIterableContaining([3])).toThrowError(EnsureError);
  });

  it("checks length-based collections", () => {
    const list = [1, 2, 3];
    const chain = ensure(list).toHaveLength(3);
    expect(chain.value).toBe(list);
  });

  it("throws when length does not match", () => {
    expect(() => ensure("abc").toHaveLength(2)).toThrowError(EnsureError);
  });

  describe("negated chains", () => {
    it("inverts matcher expectations with toBe", () => {
      const chain = ensure(10).not.toBe(11);
      expect(chain.value).toBe(10);
      expect(() => ensure(5).not.toBe(5)).toThrowError(EnsureError);
    });

    it("supports chained toggling via repeated not", () => {
      const chain = ensure(5).not.toBe(4).not.toBe(5);
      expect(chain.value).toBe(5);
    });

    it("does not narrow type for negated toBeDefined", () => {
      const maybe: string | undefined = undefined;
      const chain = ensure(maybe).not.toBeDefined();
      expect(chain.value).toBeUndefined();
      const result = chain.value;
      const union: string | undefined = result;
      expect(union).toBeUndefined();
      const roundtrip: typeof result = maybe;
      void roundtrip;
    });

    it("preserves original type when array matcher is negated", () => {
      const maybeValues: readonly number[] | Set<number> = [1, 2, 3];
      const chain = ensure(maybeValues).not.toBeArrayContaining([4]);
      expect(chain.value).toBe(maybeValues);
      const result = chain.value;
      const union: readonly number[] | Set<number> = result;
      expect(union).toBe(maybeValues);
      const roundtrip: typeof result = maybeValues;
      void roundtrip;
    });

    it("keeps length-based types unchanged when negated", () => {
      const value: string | number[] = "abc";
      const chain = ensure(value).not.toHaveLength(5);
      expect(chain.value).toBe(value);
      const result = chain.value;
      const union: string | number[] = result;
      expect(union).toBe(value);
      const roundtrip: typeof result = value;
      void roundtrip;
    });
  });
});
