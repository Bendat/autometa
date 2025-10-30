import { describe, expect, it } from "vitest";
import type { ValidationPath } from "../../core/types";
import { createValidator, failure, success } from "../base";

describe("createValidator", () => {
  const path: ValidationPath = ["arg", 0];

  it("returns success when validator produces true", () => {
    const validator = createValidator<string>({
      summary: "string",
      specificity: 2,
      validate(value) {
        return typeof value === "string";
      },
    });

    const result = validator.validate("hello", path);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("produces default issue when validation fails without diagnostics", () => {
    const validator = createValidator<never>({
      summary: "string",
      specificity: 2,
      validate(value) {
        return typeof value === "string";
      },
    });

    const result = validator.validate(123, path);
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.path).toEqual(path);
    expect(result.issues[0]?.message).toContain("string");
  });

  it("propagates nested issues reported via context", () => {
    const validator = createValidator<never>({
      summary: "tuple",
      specificity: 4,
      validate(value, ctx) {
        if (!Array.isArray(value)) {
          ctx.report({ message: "expected array" });
          return false;
        }
        const child = ctx.child(0);
        if (value[0] !== "ok") {
          child.report({ message: "expected first element to be 'ok'", actual: value[0] });
          return false;
        }
        return true;
      },
    });

    const result = validator.validate(["no"], path);
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.path).toEqual(["arg", 0, 0]);
    expect(result.issues[0]?.actual).toBe("no");
  });

  it("supports returning transformed values on success", () => {
    const validator = createValidator<number>({
      summary: "number",
      specificity: 3,
      validate(value) {
        if (typeof value !== "number") {
          return failure({ path, message: "expected number" });
        }
        return success(value * 2);
      },
    });

    const successResult = validator.validate(2, path);
    expect(successResult.ok).toBe(true);
    expect(successResult.value).toBe(4);

    const failureResult = validator.validate("nope", path);
    expect(failureResult.ok).toBe(false);
    expect(failureResult.issues).toHaveLength(1);
  });

  it("honours optional flag on the instance", () => {
    const validator = createValidator<never>({
      summary: "noop",
      specificity: 0,
      optional: true,
      validate() {
        return true;
      },
    });

    expect(validator.optional).toBe(true);
  });
});
