import { describe, expect, it } from "vitest";
import { createValidator } from "../../validators/base";
import { normalizeDefinition, normalizeSignatures } from "../signature";

const requiredValidator = createValidator<number>({
  summary: "number",
  specificity: 3,
  validate(value) {
    return typeof value === "number";
  },
});

const optionalValidator = createValidator<string>({
  summary: "string",
  specificity: 2,
  optional: true,
  validate(value) {
    return typeof value === "string";
  },
});

describe("normalizeSignatures", () => {
  it("computes arity and specificity totals", () => {
    const [signature] = normalizeSignatures([
      {
        name: "test",
        validators: [requiredValidator, optionalValidator],
        handler: () => "ok",
      },
    ]);

    expect(signature).toBeDefined();
    if (!signature) {
      throw new Error("expected normalized signature");
    }

    expect(signature.id).toBe(0);
  expect(signature.minArity).toBe(1);
  expect(signature.requiredArity).toBe(1);
    expect(signature.maxArity).toBe(2);
    expect(signature.specificity).toBe(5);
    expect(signature.fallback).toBe(false);
  });

  it("marks fallback signatures and resets minimum arity", () => {
    const [signature] = normalizeSignatures([
      {
        fallback: true,
        validators: [requiredValidator],
        handler: () => undefined,
      },
    ]);

    expect(signature).toBeDefined();
    if (!signature) {
      throw new Error("expected normalized fallback signature");
    }

  expect(signature.fallback).toBe(true);
  expect(signature.minArity).toBe(0);
  expect(signature.requiredArity).toBe(1);
  });
});

describe("normalizeDefinition", () => {
  it("allows normalizing a single definition with a custom id", () => {
    const signature = normalizeDefinition({
      description: "single",
      validators: [requiredValidator],
    }, 42);

  expect(signature.id).toBe(42);
  expect(signature.description).toBe("single");
  expect(signature.requiredArity).toBe(1);
  expect(signature.specificity).toBe(3);
  });
});
