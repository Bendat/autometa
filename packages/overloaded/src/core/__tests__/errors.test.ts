import { describe, expect, it } from "vitest";
import { AmbiguousOverloadError, NoOverloadMatchedError } from "../errors";
import type { NormalizedSignature, SignatureFailureReport, ValidatorInstance } from "../types";

function makeSignature(overrides: Partial<NormalizedSignature> = {}): NormalizedSignature {
  return {
    id: overrides.id ?? 1,
    validators: overrides.validators ?? [],
    minArity: overrides.minArity ?? 0,
    requiredArity: overrides.requiredArity ?? 0,
    maxArity: overrides.maxArity ?? 0,
    specificity: overrides.specificity ?? 0,
    fallback: overrides.fallback ?? false,
    ...overrides,
  };
}

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

describe("AmbiguousOverloadError", () => {
  it("captures the matching signatures", () => {
    const matches = [
      makeSignature({ id: 1, name: "first" }),
      makeSignature({ id: 2, name: "second" }),
    ];

    const error = new AmbiguousOverloadError("conflict", matches);

    expect(error.name).toBe("AmbiguousOverloadError");
    expect(error.message).toBe("conflict");
    expect(error.matches).toBe(matches);
  });
});

describe("NoOverloadMatchedError", () => {
  it("includes formatted argument and failure details in the message", () => {
    const args = ["alice", 42, function helper() {
      return "noop";
    }];
    const failures: SignatureFailureReport[] = [
      {
        signature: makeSignature({
          id: 3,
          name: "stringThenNumber",
          validators: [makeValidator("string"), makeValidator("number")],
        }),
        expected: ["string", "number"],
        issues: [
          { path: ["arg", 0], message: "Argument mismatch" },
          { path: ["arg", 1], message: "Argument mismatch" },
        ],
      },
      {
        signature: makeSignature({
          id: 4,
          description: "fallback payload",
          validators: [makeValidator("shape<{name, age}>")],
        }),
        expected: ["shape<{name, age}>"],
        issues: [{ path: ["payload", 0, "id"], message: "Missing id" }],
      },
    ];

    const error = new NoOverloadMatchedError(args, failures);

    expect(error.name).toBe("NoOverloadMatchedError");
    expect(error.args).toEqual(args);
    expect(error.failures).toBe(failures);
    expect(error.message).toContain('No overload matched for ("alice", 42, [Function helper])');
    expect(error.message).toContain("• stringThenNumber");
    expect(error.message).toContain("Expected: string, number");
    expect(error.message).toContain("arg.[0] Argument mismatch");
    expect(error.message).toContain("payload.[0].id Missing id");
  });

  it("omits issue lines when no issues are reported", () => {
    const args = [true];
    const failures: SignatureFailureReport[] = [
      {
        signature: makeSignature({ id: 5, name: "exact" }),
        expected: ["string"],
        issues: [],
      },
    ];

    const error = new NoOverloadMatchedError(args, failures);

    expect(error.message).toContain("• exact");
    expect(error.message).toContain("Expected: string");
    expect(error.message).not.toContain("-");
  });
});
