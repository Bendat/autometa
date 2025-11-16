import { describe, expect, it } from "vitest";
import { applyTransformers, coercePrimitive } from "./coercion";

const baseContext = {
  shape: "headerless" as const,
  rowIndex: 0,
  columnIndex: 0,
  raw: "value",
};

describe("coercion helpers", () => {
  it("coerces numbers and booleans", () => {
    expect(coercePrimitive(" 42 ")).toBe(42);
    expect(coercePrimitive("true")).toBe(true);
    expect(coercePrimitive("false")).toBe(false);
  });

  it("returns original string when no primitive match", () => {
    expect(coercePrimitive("not-a-number")).toBe("not-a-number");
  });

  it("prefers transformer over coercion", () => {
    const result = applyTransformers("mission", baseContext, (value) => `${value}-xform`, true);
    expect(result).toBe("mission-xform");
  });

  it("falls back to coercion when requested", () => {
    const result = applyTransformers("12", baseContext, undefined, true);
    expect(result).toBe(12);
  });

  it("returns raw strings when coercion is disabled", () => {
    const result = applyTransformers("007", baseContext, undefined, false);
    expect(result).toBe("007");
  });
});
