import { describe, it, expect, vi } from "vitest";
import { number } from "./arguments/number-argument";
import { string } from "./arguments/string-argument";
import { Overload } from "./overload";

describe("Overload Object", () => {
  it("should match the correct argument signature", () => {
    const overload = new Overload([string(), number(), string()], vi.fn());
    const matches = overload.isMatch(["hi", 1, "ho"]);
    expect(matches).toBe(true);
  });
  it("should not match with a missing argument", () => {
    const overload = new Overload([string(), number(), string()], vi.fn());
    const matches = overload.isMatch(["hi", 1]);
    overload.getReport(0, ["hi", 1]);
    expect(matches).toBe(false);
  });

  it("should not match with incorrect argument", () => {
    const overload = new Overload([string(), number(), string()], vi.fn());
    const matches = overload.isMatch([1, 1]);
    expect(matches).toBe(false);
  });

  it("should not match with no arguments", () => {
    const overload = new Overload([string(), number(), string()], vi.fn());
    const matches = overload.isMatch([]);
    expect(matches).toBe(false);
  });

  it("should not match with undefined arguments", () => {
    const overload = new Overload([string(), number(), string()], vi.fn());
    const matches = overload.isMatch(undefined as unknown as []);
    expect(matches).toBe(false);
  });
});
