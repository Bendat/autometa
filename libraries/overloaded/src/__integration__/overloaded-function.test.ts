import { string } from "src/arguments/string-argument";
import { overloads } from "src/overloads";
import { params } from "src/params";
import { describe, it, expect, vi, beforeEach } from "vitest";
const testFn = vi.fn();
// function overloaded(stringParam1: string, stringparam2: string): void;
function overloaded(...args: unknown[]) {
  return overloads(
    params(string(), string()).matches((a, b) => {
      console.log(a);
      console.log(b);
      testFn(a, b);
      return "hello there";
    })
  ).use(args);
}

describe("integration test - function", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("should match a (string, string) function", () => {
    const result = overloaded("hi", "there");
    expect(testFn).toHaveBeenCalledTimes(1);
    expect(testFn).toBeCalledWith(["hi", "there"], undefined);
    expect(result).toEqual("hello there");
  });
});
