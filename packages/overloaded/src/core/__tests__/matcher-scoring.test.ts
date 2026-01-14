import { describe, expect, it, vi } from "vitest";
import { Matcher } from "../matcher";
import { boolean, literal, number, string, unknown } from "../../validators/primitives";

describe("Matcher scoring", () => {
  it("prefers signatures with higher specificity", () => {
    const specific = vi.fn(() => "string");
    const generic = vi.fn(() => "unknown");

    const matcher = Matcher.from([
      { validators: [unknown()], handler: generic },
      { validators: [string()], handler: specific },
    ]);

    const result = matcher.use(["value"]);

    expect(result).toBe("string");
    expect(specific).toHaveBeenCalledWith("value");
    expect(generic).not.toHaveBeenCalled();
  });

  it("prefers exact arity when specificity ties", () => {
    const twoArgs = vi.fn(() => "two");
    const optionalSecond = vi.fn(() => "optional");

    const matcher = Matcher.from([
      { validators: [number(), string()], handler: twoArgs },
      { validators: [number(), string({ optional: true })], handler: optionalSecond },
    ]);

    const result = matcher.use([1, "arg"]);

    expect(result).toBe("two");
    expect(twoArgs).toHaveBeenCalledWith(1, "arg");
    expect(optionalSecond).not.toHaveBeenCalled();
  });

  it("selects later declarations on full tie", () => {
    const first = vi.fn(() => "first");
    const second = vi.fn(() => "second");

    const matcher = Matcher.from([
      { validators: [boolean()], handler: first },
      { validators: [boolean()], handler: second },
    ]);

    const result = matcher.use([true]);

    expect(result).toBe("second");
    expect(second).toHaveBeenCalledWith(true);
    expect(first).not.toHaveBeenCalled();
  });

  it("falls back when no signature matches", () => {
    const fallback = vi.fn(() => "fallback");
    const matcher = Matcher.from([
      { validators: [literal("ok")], handler: () => "match" },
      { validators: [], fallback: true, handler: fallback },
    ]);

    const result = matcher.use(["nope"]);

    expect(result).toBe("fallback");
    expect(fallback).toHaveBeenCalledWith("nope");
  });
});
