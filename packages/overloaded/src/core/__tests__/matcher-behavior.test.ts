import { describe, expect, it, vi } from "vitest";
import { Matcher } from "../matcher";
import { string, number } from "../../validators/primitives";
import { tuple } from "../../validators/composite";
import { NoOverloadMatchedError } from "../errors";

describe("Matcher behavior", () => {
  it("throws NoOverloadMatchedError with diagnostic information when no signatures match", () => {
    const matcher = Matcher.from([
      { name: "expects-number", validators: [number({ min: 1 })], handler: () => "number" },
    ]);

    let captured: unknown;
    try {
      matcher.use(["not-a-number"]);
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(NoOverloadMatchedError);
    const typed = captured as NoOverloadMatchedError;
    expect(typed.args).toEqual(["not-a-number"]);
    expect(typed.failures).toHaveLength(1);
    expect(typed.failures[0]?.signature.name).toBe("expects-number");
    expect(typed.message).toContain('No overload matched for ("not-a-number")');
    expect(typed.message).toContain("Expected: number");
  });

  it("reports unexpected arguments when more values are supplied than validators", () => {
    const matcher = Matcher.from([
      { name: "single-string", validators: [string()], handler: () => "ok" },
    ]);

    let captured: unknown;
    try {
      matcher.use(["name", 123]);
    } catch (error) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(NoOverloadMatchedError);
  const typed = captured as NoOverloadMatchedError;
  const firstFailure = typed.failures[0];
  expect(firstFailure?.issues).toHaveLength(1);
  expect(firstFailure?.issues[0]?.message).toBe("Received 2 arguments, expected between 1 and 1");
  expect(typed.message).toContain("Received 2 arguments");
  });

  it("allows optional tuple elements without triggering errors", () => {
    const matcher = Matcher.from([
      {
        validators: [tuple([string(), number({ optional: true })])],
        handler: (entry) => {
          const typed = entry as [string, number?];
          return typed[0];
        },
      },
    ]);

    const result = matcher.use([["alpha"]]);
    expect(result).toBe("alpha");
  });

  it("raises configured errors without invoking the handler when a signature declares throws", () => {
    const handler = vi.fn();
    const matcher = Matcher.from([
      {
        validators: [string()],
        handler,
        throws: { error: TypeError, message: "boom" },
      },
    ]);

    expect(() => matcher.use(["value"])).toThrowError(new TypeError("boom"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("throws when fallback signature lacks a handler", () => {
    const matcher = new Matcher([
      {
        id: 0,
        validators: [string()],
        minArity: 1,
        requiredArity: 1,
        maxArity: 1,
        specificity: 1,
        fallback: false,
      },
      {
        id: 1,
        validators: [],
        minArity: 0,
        requiredArity: 0,
        maxArity: 0,
        specificity: 0,
        fallback: true,
      },
    ]);

    expect(() => matcher.use([123])).toThrowError(NoOverloadMatchedError);
  });
});
