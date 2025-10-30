import { describe, expect, it } from "vitest";
import { AutomationError, type AutomationErrorOptions } from "../automation-error";
import { raise } from "../raise";

class CustomAutomationError extends AutomationError {
  constructor(message: string, options: AutomationErrorOptions = {}) {
    super(message, options);
    this.name = "CustomAutomationError";
  }
}

describe("raise", () => {
  it("throws an AutomationError by default", () => {
    expect(() => raise("Boom")).toThrowError(AutomationError);
  });

  it("attaches the provided cause", () => {
    const cause = new Error("inner");

    try {
      raise("Boom", { cause });
      expect.fail("Expected raise to throw");
    } catch (error) {
      const automation = error as AutomationError;
      expect(automation).toBeInstanceOf(AutomationError);
      expect(automation.cause).toBe(cause);
    }
  });

  it("supports custom AutomationError types", () => {
    try {
      raise("Boom", { type: CustomAutomationError });
      expect.fail("Expected raise to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(CustomAutomationError);
    }
  });

  it("supports legacy constructors without cause option", () => {
    class LegacyError extends Error {
      constructor(message: string, ...rest: unknown[]) {
        if (rest.length > 0) {
          throw new TypeError("additional arguments unsupported");
        }
        super(message);
      }
    }

    const inner = new Error("inner");

    try {
      raise("Legacy", { type: LegacyError, cause: inner });
      expect.fail("Expected raise to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(LegacyError);
      expect((error as { cause?: unknown }).cause).toBe(inner);
    }
  });
});
