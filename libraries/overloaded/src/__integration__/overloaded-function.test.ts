import { array } from "src/arguments/array-argument";
import { boolean } from "src/arguments/boolean-argument";
import { number } from "src/arguments/number-argument";
import { string } from "src/arguments/string-argument";
import { tuple } from "src/arguments/tuple-argument";
import { shape } from "src/arguments/shape-argument";
import { overloads } from "src/overloads";
import { params } from "src/params";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { func } from "src/arguments/function-argument";
const testFn = vi.fn();

function overloaded(stringParam1: number, stringparam2: number): number;
function overloaded(stringParam1: string, stringparam2: string): string;
function overloaded(
  stringParam1: [string, number],
  stringparam2: boolean
): [string, number, boolean];
function overloaded(arrayParam: (string | number)[]): void;
function overloaded(shapeParam: { c: string; d: [string, number] }): void;
function overloaded(functionParam: (a: string) => string): void;
function overloaded(...args: unknown[]) {
  return overloads(
    params(string(), string()).matches((a, b) => {
      expect(typeof a).toEqual("string");
      expect(typeof b).toEqual("string");
      testFn(a, b);
      return "hello there";
    }),
    params(number(), number()).matches((a, b) => {
      expect(typeof a).toEqual("number");
      expect(typeof b).toEqual("number");
      testFn(a, b);
      return a + b;
    }),
    params(tuple([string(), number()]), boolean()).matches((a, b) => {
      const [a1, a2] = a;
      expect(typeof a1).toEqual("string");
      expect(typeof a2).toEqual("number");
      expect(typeof b).toEqual("boolean");
      testFn(a, b);
      return [a1, a2, b];
    }),
    params(array([string("a1"), number("a2")])).matches((a) => {
      const [a1, a2] = a;
      expect(typeof a1).toEqual("string");
      expect(typeof a2).toEqual("number");
      testFn(a);
      return [a1, a2];
    }),
    params(
      shape("a", { c: string("c"), d: array([string(), number()]) })
    ).matches((a) => {
      const { c, d } = a;
      expect(typeof c).toEqual("string");
      expect(typeof c).toEqual("string");
      expect(d).toBeInstanceOf(Array);
      testFn(a);
      return d;
    }),
    params(func<(a: string) => string>("a")).matches((a) => {
      expect(typeof a).toEqual("function");
      expect(a).toHaveLength(1);
      testFn(a);
    }) // this comment prevents a weird prettier/lint bug
  ).use(args);
}

describe("integration test - function", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("should match a (string, string) function", () => {
    const result = overloaded("hi", "there");
    expect(testFn).toHaveBeenCalledTimes(1);
    expect(testFn).toBeCalledWith("hi", "there");
    expect(result).toEqual("hello there");
  });
  it("should match a (number, number) function", () => {
    const result = overloaded(1, 2);
    expect(testFn).toHaveBeenCalledTimes(1);
    expect(testFn).toBeCalledWith(1, 2);
    expect(result).toEqual(3);
  });
  it("should match a ([string, number], boolean) function", () => {
    const result = overloaded(["hello", 1], true);
    expect(testFn).toHaveBeenCalledTimes(1);
    expect(testFn).toBeCalledWith(["hello", 1], true);
    expect(result).toEqual(["hello", 1, true]);
  });
  it("should match a (string | number)[] function", () => {
    const result = overloaded(["hello", 1]);
    expect(testFn).toHaveBeenCalledTimes(1);
    expect(testFn).toBeCalledWith(["hello", 1]);
    expect(result).toEqual(["hello", 1]);
  });
  it("should match a ({ a: string; b: boolean }) function", () => {
    const result = overloaded({ c: "", d: ["hello", 1] });
    expect(testFn).toHaveBeenCalledTimes(1);
    expect(testFn).toBeCalledWith({ c: "", d: ["hello", 1] });
    expect(result).toEqual(["hello", 1]);
  });
  it("should match a ((a: string)=> string) function", () => {
    overloaded((a: string) => a);
    expect(testFn).toHaveBeenCalledTimes(1);
  });
});
