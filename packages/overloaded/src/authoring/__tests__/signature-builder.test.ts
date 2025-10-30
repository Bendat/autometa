import { describe, expect, it, vi } from "vitest";
import { SignatureBuilder } from "../signature-builder";
import type { ValidatorInstance } from "../../core/types";

function makeValidator(summary: string): ValidatorInstance {
  return {
    optional: false,
    specificity: 1,
    summary,
    validate() {
      return { ok: true, issues: [] };
    },
  };
}

describe("SignatureBuilder", () => {
  it("builds definitions with metadata when provided", () => {
    const validators = [makeValidator("value")];
    const builder = SignatureBuilder.create(validators, "named", "described");

    const definition = builder.build();

    expect(definition.name).toBe("named");
    expect(definition.description).toBe("described");
    expect(definition.validators).toHaveLength(1);
    expect(definition.validators[0].summary).toBe("value");
    expect(definition.fallback).toBe(false);
  });

  it("clones the validator list passed to create", () => {
    const validators = [makeValidator("initial")];
    const builder = SignatureBuilder.create(validators);

    validators.push(makeValidator("mutated"));

    const definition = builder.build();
    expect(definition.validators).toHaveLength(1);
    expect(definition.validators[0].summary).toBe("initial");
  });

  it("keeps builder instances immutable when adding handlers", () => {
    const base = SignatureBuilder.create([makeValidator("value")]);
    const handler = vi.fn();

    const next = base.withHandler(handler);

    expect(base.build().handler).toBeUndefined();
    expect(next.build().handler).toBe(handler);
  });

  it("attaches throw specifications with and without messages", () => {
    const base = SignatureBuilder.create([makeValidator("value")]);

    const withMessage = base.withThrows({ error: TypeError, message: "bad" }).build();
    const withoutMessage = base.withThrows({ error: RangeError }).build();

    expect(withMessage.throws).toEqual({ error: TypeError, message: "bad" });
    expect(withoutMessage.throws).toEqual({ error: RangeError });
  });

  it("marks signatures as fallback when requested", () => {
    const base = SignatureBuilder.create([makeValidator("value")]);

    const definition = base.markFallback().build();

    expect(definition.fallback).toBe(true);
  });
});
