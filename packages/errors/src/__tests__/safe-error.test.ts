import { describe, expect, it } from "vitest";
import { AutomationError } from "../automation-error";
import { safe, safeAsync } from "../safe-error";

describe("safe", () => {
  it("returns the callback result when successful", () => {
    const result = safe(() => 42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("converts thrown errors into AutomationError", () => {
    const cause = new Error("failure");
    const result = safe(() => {
      throw cause;
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ ok: false, error: expect.any(AutomationError) });
    expect(result.ok ? undefined : result.error.cause).toBe(cause);
  });

  it("preserves existing AutomationError instances", () => {
    const automation = new AutomationError("fail");
    const result = safe(() => {
      throw automation;
    });

    expect(result).toEqual({ ok: false, error: automation });
  });
});

describe("safeAsync", () => {
  it("resolves with the action result", async () => {
    const result = await safeAsync(async () => 24);
    expect(result).toEqual({ ok: true, value: 24 });
  });

  it("captures rejections as AutomationError", async () => {
    const cause = new Error("async fail");
    const result = await safeAsync(async () => {
      throw cause;
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ ok: false, error: expect.any(AutomationError) });
    expect(result.ok ? undefined : result.error.cause).toBe(cause);
  });
});
