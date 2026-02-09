import { assertType, describe, it } from "vitest";

import { ensure } from "../ensure";

class CustomError extends Error {
  public readonly flag = true;
}

describe("ensure type inference", () => {
  it("narrows value after toBeDefined", () => {
    const input: string | undefined = "value";
    const chain = ensure(input).toBeDefined();

    assertType<string>(chain.value);
  });

  it("retains union for negated toBeDefined", () => {
    const maybe: string | undefined = undefined;
    const chain = ensure(maybe).not.toBeDefined();

    assertType<string | undefined>(chain.value);
  });

  it("narrows to constructor instance with toBeInstanceOf", () => {
    const value: Error | CustomError = new CustomError("boom");
    const chain = ensure(value).toBeInstanceOf(CustomError);

    assertType<CustomError>(chain.value);
    assertType<{ flag: true }>(chain.value);
  });

  it("preserves union when instance matcher is negated", () => {
    const value: Error | CustomError = new Error("fail");
    const chain = ensure(value).not.toBeInstanceOf(CustomError);

    assertType<Error | CustomError>(chain.value);
  });

  it("narrows array types after toBeArrayContaining", () => {
    const input: readonly number[] | Set<number> = [1, 2, 3];
    const chain = ensure(input).toBeArrayContaining([1]);

    assertType<readonly number[]>(chain.value);
  });

  it("keeps original union when array matcher is negated", () => {
    const input: readonly number[] | Set<number> = [1, 2, 3];
    const chain = ensure(input).not.toBeArrayContaining([4]);

    assertType<readonly number[] | Set<number>>(chain.value);
  });

  it("narrows iterable types", () => {
    const input: Iterable<number> | string = new Set([1, 2, 3]);
    const chain = ensure(input).toBeIterableContaining([2]);

    assertType<Iterable<number>>(chain.value);
  });

  it("narrows to length-bearing values", () => {
    const input: string | Set<number> = "abc";
    const chain = ensure(input).toHaveLength(3);

    assertType<string>(chain.value);
  });

  it("retains union when length assertion is negated", () => {
    const input: string | Set<number> = "abc";
    const chain = ensure(input).not.toHaveLength(2);

    assertType<string | Set<number>>(chain.value);
  });

  it("narrows to number after numeric matcher", () => {
    const input: number | string = 123;
    const chain = ensure(input).toBeGreaterThan(0);

    assertType<number>(chain.value);
  });

  it("preserves union when numeric matcher is negated", () => {
    const input: number | string = 123;
    const chain = ensure(input).not.toBeGreaterThan(1000);

    assertType<number | string>(chain.value);
  });

  it("supports map/each for array chains", () => {
    const input = [{ id: 1 }, { id: 2 }];

    ensure(input)
      .map((value) => value.id, { label: "ids" })
      .each((id, index) => {
        assertType<number>(id.value);
        assertType<number>(index);
      });
  });

  it("supports tap while preserving chain type", () => {
    const input: number[] = [1, 2, 3];
    const chain = ensure(input).tap((value, context) => {
      assertType<number[]>(value);
      assertType<false>(context.isNot);
    });

    assertType<number[]>(chain.value);
  });

  it("types negated tap context as true", () => {
    ensure("value").not.tap((_value, context) => {
      assertType<true>(context.isNot);
    });
  });

  it("preserves element typing after toBeInstanceOf(Array)", () => {
    const input = [{ item: "latte" }, { item: "cappuccino" }];

    ensure(input)
      .toBeInstanceOf(Array)
      .map((row) => row.item)
      .each((item) => {
        assertType<string>(item.value);
      });
  });

  it("narrows type after toBeTypeOf", () => {
    const input: string | number = "value";
    const chain = ensure(input).toBeTypeOf("string");

    assertType<string>(chain.value);
  });

  it("supports prop()/pluck() helpers", () => {
    const record = { nested: { id: 1 } };
    ensure(record).prop("nested").prop("id").toBeTypeOf("number");

    const rows = [{ id: 1 }, { id: 2 }];
    ensure(rows).pluck("id").each((id) => id.toBeTypeOf("number"));
  });

  it("rejects map/each for non-array chains", () => {
    const textChain = ensure("not an array");
    const numberChain = ensure(123);

    const assertInvalidUsages = () => {
      // @ts-expect-error map is only available for array-backed ensure chains
      textChain.map((value) => value);

      // @ts-expect-error each is only available for array-backed ensure chains
      numberChain.each((value) => value.toBeDefined());
    };

    void assertInvalidUsages;
  });

  it("rejects prop()/pluck() helpers for incompatible chains", () => {
    const scalarChain = ensure("not object");
    const numberArrayChain = ensure([1, 2, 3]);

    const assertInvalidUsages = () => {
      // @ts-expect-error prop is only available for object-backed ensure chains
      scalarChain.prop("length");

      // @ts-expect-error pluck is only available for arrays of objects
      numberArrayChain.pluck("toString");
    };

    void assertInvalidUsages;
  });
});
