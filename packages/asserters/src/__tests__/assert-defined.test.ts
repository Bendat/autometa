import { describe, it, expect } from "vitest";
import { assertDefined } from "../assert-defined.js";
import { AutomationError } from "@autometa/errors";

describe("assertDefined", () => {
  it("should not throw for defined values", () => {
    expect(() => assertDefined(0)).not.toThrow();
    expect(() => assertDefined("")).not.toThrow();
    expect(() => assertDefined(false)).not.toThrow();
    expect(() => assertDefined([])).not.toThrow();
    expect(() => assertDefined({})).not.toThrow();
  });

  it("should throw for null", () => {
    expect(() => assertDefined(null)).toThrow(AutomationError);
    expect(() => assertDefined(null)).toThrow("Expected value to be defined, but got null");
  });

  it("should throw for undefined", () => {
    expect(() => assertDefined(undefined)).toThrow(AutomationError);
    expect(() => assertDefined(undefined)).toThrow("Expected value to be defined, but got undefined");
  });

  it("should include context in error message", () => {
    expect(() => assertDefined(null, "user.name")).toThrow("[user.name]");
  });

  it("should narrow types correctly", () => {
    const maybeString: string | undefined = "hello";
    assertDefined(maybeString);
    // TypeScript should know this is string now
    const length: number = maybeString.length;
    expect(length).toBe(5);
  });
});
