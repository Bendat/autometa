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
});
