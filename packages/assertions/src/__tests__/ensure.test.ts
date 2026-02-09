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

  it("supports null/undefined assertions including negated null checks", () => {
    const nullChain = ensure<string | null>(null).toBeNull();
    expect(nullChain.value).toBeNull();

    const negatedNull = ensure("value").not.toBeNull();
    expect(negatedNull.value).toBe("value");

    const undefinedChain = ensure<string | undefined>(undefined).toBeUndefined();
    expect(undefinedChain.value).toBeUndefined();

    expect(() => ensure(null).not.toBeNull()).toThrowError(EnsureError);
    expect(() => ensure("value").toBeUndefined()).toThrowError(EnsureError);
  });

  it("supports truthiness and falsiness assertions", () => {
    ensure("value").toBeTruthy();
    ensure("").toBeFalsy();

    expect(() => ensure(0).toBeTruthy()).toThrowError(EnsureError);
    expect(() => ensure(1).toBeFalsy()).toThrowError(EnsureError);
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

  it("supports negated contain-equal checks", () => {
    const values = [1, { nested: true }];
    const chain = ensure(values).not.toContainEqual({ nested: false });
    expect(chain.value).toBe(values);
  });

  it("asserts iterables contain expected values", () => {
    const set = new Set([1, 2, 3]);
    const chain = ensure(set).toBeIterableContaining([2, 3]);
    expect(chain.value).toBe(set);
  });

  it("supports negated iterable containment checks", () => {
    const set = new Set([1, 2, 3]);
    const chain = ensure(set).not.toBeIterableContaining([5]);
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

  describe("numeric matchers", () => {
    it("supports toBeGreaterThan", () => {
      const chain = ensure(10).toBeGreaterThan(5);
      expect(chain.value).toBe(10);
      expect(() => ensure(5).toBeGreaterThan(10)).toThrowError(EnsureError);
    });

    it("supports toBeGreaterThanOrEqual including negated path", () => {
      const chain = ensure(10).toBeGreaterThanOrEqual(10);
      expect(chain.value).toBe(10);

      const negated = ensure(10).not.toBeGreaterThanOrEqual(11);
      expect(negated.value).toBe(10);

      expect(() => ensure(10).toBeGreaterThanOrEqual(11)).toThrowError(EnsureError);
      expect(() => ensure(10).not.toBeGreaterThanOrEqual(10)).toThrowError(EnsureError);
    });

    it("supports toBeLessThan including negated path", () => {
      const chain = ensure(5).toBeLessThan(10);
      expect(chain.value).toBe(5);

      const negated = ensure(5).not.toBeLessThan(4);
      expect(negated.value).toBe(5);

      expect(() => ensure(10).toBeLessThan(5)).toThrowError(EnsureError);
      expect(() => ensure(5).not.toBeLessThan(10)).toThrowError(EnsureError);
    });

    it("supports toBeLessThanOrEqual including negated path", () => {
      const chain = ensure(5).toBeLessThanOrEqual(5);
      expect(chain.value).toBe(5);

      const negated = ensure(5).not.toBeLessThanOrEqual(4);
      expect(negated.value).toBe(5);

      expect(() => ensure(6).toBeLessThanOrEqual(5)).toThrowError(EnsureError);
      expect(() => ensure(5).not.toBeLessThanOrEqual(5)).toThrowError(EnsureError);
    });

    it("supports toBeCloseTo with precision", () => {
      ensure(1.005).toBeCloseTo(1.01, 2);
      expect(() => ensure(1.0).toBeCloseTo(1.02, 2)).toThrowError(EnsureError);
    });

    it("narrows union to number when not negated", () => {
      const value: number | string = 7;
      const chain = ensure(value).toBeGreaterThan(1);
      expectTypeOf(chain.value).toEqualTypeOf<number>();
    });

    it("does not narrow union when negated", () => {
      const value: number | string = 7;
      const chain = ensure(value).not.toBeGreaterThan(100);
      expectTypeOf(chain.value).toEqualTypeOf<number | string>();
    });
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

  describe("tap helper", () => {
    it("invokes the callback and preserves the original chain value", () => {
      const values = [1, 2, 3];
      const chain = ensure(values)
        .tap((value, context) => {
          expect(value).toBe(values);
          expect(context.isNot).toBe(false);
        })
        .toHaveLength(3);

      expect(chain.value).toBe(values);
    });

    it("exposes negation state to the callback", () => {
      ensure(5)
        .not
        .tap((value, context) => {
          expect(value).toBe(5);
          expect(context.isNot).toBe(true);
        })
        .toBe(4);
    });
  });

  describe("array helpers", () => {
    it("maps arrays and rewraps the mapped output", () => {
      const chain = ensure([1, 2, 3]).map((value) => value * 2);
      expect(chain.value).toEqual([2, 4, 6]);
    });

    it("runs each assertion with an element ensure chain", () => {
      ensure([1, 2, 3])
        .map((value) => typeof value, { label: "value should be a number" })
        .each((valueType) => valueType.toStrictEqual("number"));
    });

    it("includes the index in the propagated label", () => {
      try {
        ensure([1, 2])
          .map((value) => value, { label: "expected one" })
          .each((value) => value.toBe(1));
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(EnsureError);
        expect((error as EnsureError).message).toContain("Received expected one (index 1): 2");
      }
    });

    it("supports function labels for each() elements", () => {
      try {
        ensure([1, 2]).each((value) => value.toBe(1), {
          label: ({ index, value }) => `expected one at ${index}, got ${value}`,
        });
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(EnsureError);
        expect((error as EnsureError).message).toContain("Received expected one at 1, got 2: 2");
      }
    });

    it("plucks properties from array elements", () => {
      const chain = ensure([{ item: "a" }, { item: "b" }]).pluck("item");
      expect(chain.value).toEqual(["a", "b"]);
    });

    it("fails pluck when an element is not an object", () => {
      expect(() => ensure([{ item: "a" }, null as unknown as { item: string }]).pluck("item"))
        .toThrowError(EnsureError);
    });
  });

  describe("type matchers", () => {
    it("asserts typeof matches the expected type", () => {
      ensure("abc").toBeTypeOf("string");
      ensure(123).toBeTypeOf("number");
      expect(() => ensure(123).toBeTypeOf("string")).toThrowError(EnsureError);
    });

    it("supports negated type assertions", () => {
      ensure(123).not.toBeTypeOf("string");
      expect(() => ensure("abc").not.toBeTypeOf("string")).toThrowError(EnsureError);
    });
  });

  describe("object helpers", () => {
    it("extracts properties via prop()", () => {
      ensure({ item: "a", count: 2 }).prop("item").toBe("a");
    });

    it("fails prop() when the value is not an object", () => {
      expect(() => (ensure(null) as unknown as { prop: (key: string) => unknown }).prop("x"))
        .toThrowError(EnsureError);
    });
  });
});
