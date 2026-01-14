import { describe, expect, it } from "vitest";
import { AutomationError } from "../automation-error";

describe("AutomationError", () => {
  it("preserves message and assigns name", () => {
    const error = new AutomationError("Boom");
    expect(error.message).toBe("Boom");
    expect(error.name).toBe("AutomationError");
  });

  it("exposes provided cause", () => {
    const cause = new Error("cause");
    const error = new AutomationError("Boom", { cause });
    expect(error.cause).toBe(cause);
  });

  it("wrap returns existing automation errors", () => {
    const existing = new AutomationError("wrapped");
    expect(AutomationError.wrap(existing)).toBe(existing);
  });

  it("wrap promotes native errors", () => {
    const cause = new Error("native");
    const wrapped = AutomationError.wrap(cause);
    expect(wrapped).toBeInstanceOf(AutomationError);
    expect(wrapped.cause).toBe(cause);
  });

  it("wrap uses fallback message for non-error values", () => {
    const wrapped = AutomationError.wrap({ reason: "unexpected" }, "Custom fallback");
    expect(wrapped.message).toBe("Custom fallback");
    expect(wrapped.cause).toEqual({ reason: "unexpected" });
  });

  it("isAutomationError detects instances", () => {
    const err = new AutomationError("boom");
    expect(AutomationError.isAutomationError(err)).toBe(true);
    expect(AutomationError.isAutomationError(new Error("nope"))).toBe(false);
  });
});
