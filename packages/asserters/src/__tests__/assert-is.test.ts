import { describe, it, expect } from "vitest";
import { assertIs } from "../assert-is.js";
import { AutomationError } from "@autometa/errors";

describe("assertIs", () => {
  describe("primitive type checking", () => {
    it("should not throw for matching string types", () => {
      expect(() => assertIs("hello", "string")).not.toThrow();
    });

    it("should not throw for matching number types", () => {
      expect(() => assertIs(123, "number")).not.toThrow();
    });

    it("should not throw for matching boolean types", () => {
      expect(() => assertIs(true, "boolean")).not.toThrow();
    });

    it("should throw for mismatched types", () => {
      expect(() => assertIs(123, "string")).toThrow(AutomationError);
      expect(() => assertIs("hello", "number")).toThrow(AutomationError);
    });
  });

  describe("value checking", () => {
    it("should not throw for matching string values", () => {
      expect(() => assertIs("hello", "hello")).not.toThrow();
    });

    it("should not throw for matching number values", () => {
      expect(() => assertIs(42, 42)).not.toThrow();
    });

    it("should not throw for matching boolean values", () => {
      expect(() => assertIs(true, true)).not.toThrow();
      expect(() => assertIs(false, false)).not.toThrow();
    });

    it("should throw for mismatched values", () => {
      expect(() => assertIs("hello", "world")).toThrow(AutomationError);
      expect(() => assertIs(42, 99)).toThrow(AutomationError);
      expect(() => assertIs(true, false)).toThrow(AutomationError);
    });
  });

  describe("instance checking", () => {
    it("should not throw for correct Error instances", () => {
      const error = new Error("test");
      expect(() => assertIs(error, Error)).not.toThrow();
    });

    it("should not throw for correct Date instances", () => {
      const date = new Date();
      expect(() => assertIs(date, Date)).not.toThrow();
    });

    it("should throw for incorrect instances", () => {
      const error = new Error("test");
      expect(() => assertIs(error, Date)).toThrow(AutomationError);
      expect(() => assertIs({}, Error)).toThrow(AutomationError);
    });

    it("should work with custom classes", () => {
      class CustomClass {}
      const instance = new CustomClass();
      expect(() => assertIs(instance, CustomClass)).not.toThrow();
      expect(() => assertIs({}, CustomClass)).toThrow(AutomationError);
    });
  });

  describe("error messages", () => {
    it("should include context in error messages", () => {
      expect(() => assertIs(123, "string", "config.port")).toThrow("[config.port]");
    });

    it("should show expected type in error", () => {
      expect(() => assertIs(123, "string")).toThrow('type "string"');
    });

    it("should show actual value in error", () => {
      expect(() => assertIs(123, "string")).toThrow("number 123");
    });

    it("should show constructor name for instances", () => {
      expect(() => assertIs({}, Error)).toThrow("Expected instance of Error");
    });
  });

  describe("edge cases", () => {
    it("should handle null", () => {
      expect(() => assertIs(null, null)).not.toThrow();
      expect(() => assertIs(null, "string")).toThrow(AutomationError);
    });

    it("should handle undefined", () => {
      expect(() => assertIs(undefined, undefined)).not.toThrow();
      expect(() => assertIs(undefined, "string")).toThrow(AutomationError);
    });

    it("should handle object types", () => {
      expect(() => assertIs({}, "object")).not.toThrow();
      expect(() => assertIs([], "object")).not.toThrow(); // Arrays are objects
    });

    it("treats object expected values as type matches", () => {
      expect(() => assertIs({ a: 1 }, { b: 2 } as unknown)).not.toThrow();
    });

    it("handles circular values when formatting errors", () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      expect(() => assertIs(circular, "string")).toThrow(AutomationError);
    });
  });
});
