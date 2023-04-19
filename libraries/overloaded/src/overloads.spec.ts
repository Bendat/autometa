import { describe, expect, it, vi } from "vitest";
import { boolean } from "./arguments/boolean-argument";
import { number } from "./arguments/number-argument";
import { string } from "./arguments/string-argument";
import { Overload } from "./overload";
import { overloads, Overloads } from "./overloads";
import { def } from "./def";

describe("Overloads", () => {
  it("should match the correct overload", () => {
    const ssFn = vi.fn().mockReturnValue(1);
    const snFn = vi.fn();
    const overloadFunctions = [
      new Overload(undefined, undefined, [string(), string()], ssFn),
      new Overload(undefined, undefined, [string(), number()], snFn),
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
      new Overload(undefined, undefined, [string(), string()], ssFn),
      new Overload(undefined, undefined, [string(), number()], snFn),
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
      new Overload(undefined, undefined, [string(), string()], ssFn),
      new Overload(undefined, undefined, [string(), number()], snFn),
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
      def(string(), number(), boolean()).matches(testFn),
      def(number(), string()).matches(vi.fn())
    ).use(["hi", 1, true]);
    expect(testFn).toHaveBeenCalled();
  });
});
