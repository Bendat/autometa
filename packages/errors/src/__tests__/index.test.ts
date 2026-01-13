import { describe, expect, it } from "vitest";
import * as errors from "../index";

describe("package entrypoint", () => {
  it("re-exports the public API", () => {
    const {
      AutomationError,
      GherkinStepError,
      formatErrorCauses,
      formatErrorTree,
      printErrorTree,
      raise,
      safe,
      safeAsync,
    } = errors;

    expect(typeof AutomationError).toBe("function");
    expect(typeof GherkinStepError).toBe("function");
    expect(typeof formatErrorCauses).toBe("function");
    expect(typeof formatErrorTree).toBe("function");
    expect(typeof printErrorTree).toBe("function");
    expect(typeof raise).toBe("function");
    expect(typeof safe).toBe("function");
    expect(typeof safeAsync).toBe("function");
  });

  it("allows constructing and using the default AutomationError", () => {
    const cause = new Error("inner");
    const automationError = new errors.AutomationError("outer", { cause });

    expect(automationError.cause).toBe(cause);
    expect(errors.AutomationError.isAutomationError(automationError)).toBe(true);
  });
});
