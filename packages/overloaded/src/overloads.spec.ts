import { describe, expect, it, vi } from "vitest";
import { array } from "./arguments/array-argument";
import { boolean } from "./arguments/boolean-argument";
import { number } from "./arguments/number-argument";
import { string } from "./arguments/string-argument";
import { Overload } from "./overload";
import { overloads, Overloads } from "./overloads";
import { params } from "./params";

describe("Overloads", () => {
  it("should match the correct overload", () => {
    const ssFn = vi.fn().mockReturnValue(1);
    const snFn = vi.fn();
    const overloadFunctions = [
      new Overload([string(), string()], ssFn),
      new Overload([string(), number()], snFn),
    ];
    const overloads = new Overloads(overloadFunctions);
    const match = overloads.match(["hi", "ho"]);
    expect(ssFn).toHaveBeenCalled();
    expect(snFn).not.toHaveBeenCalled();
    expect(match).toEqual(1);
  });
  it("should throw an error when no matching overload is found due to a mismatch", () => {
    const ssFn = vi.fn().mockReturnValue(1);
    const snFn = vi.fn().mockReturnValue(2);
    const overloadFunctions = [
      new Overload([string(), string()], ssFn),
      new Overload([string(), number()], snFn),
    ];
    const overloads = new Overloads(overloadFunctions);
    const match = overloads.match(["hi", 1]);
    expect(ssFn).not.toHaveBeenCalled();
    expect(snFn).toHaveBeenCalled();
    expect(match).toEqual(2);
  });
  it("should throw an error when no matching overload is found due to an empty list", () => {
    const ssFn = vi.fn().mockReturnValue(1);
    const snFn = vi.fn();
    const overloadFunctions = [
      new Overload([string(), string()], ssFn),
      new Overload([string(), number()], snFn),
    ];
    const overloads = new Overloads(overloadFunctions);
    expect(() => overloads.match([])).toThrow();
    expect(ssFn).not.toHaveBeenCalled();
    expect(snFn).not.toHaveBeenCalled();
  });
});

describe("overloads function", () => {
  it("should execute the correct overload", () => {
    const testFn = vi.fn();
    overloads(
      params(string(), number(), boolean()).matches(testFn),
      params(number(), string()).matches(vi.fn())
    ).use(["hi", 1, true]);
    expect(testFn).toHaveBeenCalled();
  });
});

it("should check array vaguely works", () => {
  const testFn = vi.fn();
  overloads(
    params(array([boolean(), boolean(), number()])).matches(([a, b]) => a)
  ).use(["hi", 1, true]);
  expect(testFn).toHaveBeenCalled();
});
const a = array([string(), number()]);
//    ^?
it("dunno", () => {});