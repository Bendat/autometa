import { describe, it, expect } from "vitest";
import { assertLength, assertMinLength, assertMaxLength } from "../assert-length.js";
import { AutomationError } from "@autometa/errors";

describe("assertLength", () => {
  it("should not throw for correct array length", () => {
    expect(() => assertLength([1, 2, 3], 3)).not.toThrow();
    expect(() => assertLength([], 0)).not.toThrow();
  });

  it("should not throw for correct string length", () => {
    expect(() => assertLength("hello", 5)).not.toThrow();
    expect(() => assertLength("", 0)).not.toThrow();
  });

  it("should throw for incorrect array length", () => {
    expect(() => assertLength([1, 2], 3)).toThrow(AutomationError);
    expect(() => assertLength([1, 2], 3)).toThrow("Expected array length 3, but got 2");
  });

  it("should throw for incorrect string length", () => {
    expect(() => assertLength("hello", 10)).toThrow(AutomationError);
    expect(() => assertLength("hello", 10)).toThrow("Expected string length 10, but got 5");
  });

  it("should include context in error messages", () => {
    expect(() => assertLength([1, 2], 3, "args")).toThrow("[args]");
  });

  it("should throw for non-length-like values", () => {
    expect(() => assertLength(123 as unknown as string, 3)).toThrow(AutomationError);
    expect(() => assertLength(null as unknown as string, 0)).toThrow(AutomationError);
  });
});

describe("assertMinLength", () => {
  it("should not throw when length meets minimum", () => {
    expect(() => assertMinLength([1, 2, 3], 2)).not.toThrow();
    expect(() => assertMinLength([1, 2, 3], 3)).not.toThrow();
    expect(() => assertMinLength("hello", 3)).not.toThrow();
  });

  it("should throw when length is too short", () => {
    expect(() => assertMinLength([1], 2)).toThrow(AutomationError);
    expect(() => assertMinLength([1], 2)).toThrow("Expected array length >= 2, but got 1");
  });

  it("should throw for string too short", () => {
    expect(() => assertMinLength("hi", 5)).toThrow(AutomationError);
    expect(() => assertMinLength("hi", 5)).toThrow("Expected string length >= 5, but got 2");
  });

  it("should include context in error messages", () => {
    expect(() => assertMinLength([], 1, "items")).toThrow("[items]");
  });
});

describe("assertMaxLength", () => {
  it("should not throw when length is within maximum", () => {
    expect(() => assertMaxLength([1, 2], 3)).not.toThrow();
    expect(() => assertMaxLength([1, 2], 2)).not.toThrow();
    expect(() => assertMaxLength("hi", 5)).not.toThrow();
  });

  it("should throw when length exceeds maximum", () => {
    expect(() => assertMaxLength([1, 2, 3], 2)).toThrow(AutomationError);
    expect(() => assertMaxLength([1, 2, 3], 2)).toThrow("Expected array length <= 2, but got 3");
  });

  it("should throw for string too long", () => {
    expect(() => assertMaxLength("hello", 3)).toThrow(AutomationError);
    expect(() => assertMaxLength("hello", 3)).toThrow("Expected string length <= 3, but got 5");
  });

  it("should include context in error messages", () => {
    expect(() => assertMaxLength([1, 2, 3, 4], 2, "limit")).toThrow("[limit]");
  });
});
