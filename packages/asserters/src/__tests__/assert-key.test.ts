import { describe, it, expect } from "vitest";
import { assertKey, confirmKey, getKey, InvalidKeyError } from "../assert-key.js";
import { AutomationError } from "@autometa/errors";

describe("assertKey", () => {
  it("should not throw for existing keys", () => {
    const obj = { foo: "bar", baz: 123 };
    expect(() => assertKey(obj, "foo")).not.toThrow();
    expect(() => assertKey(obj, "baz")).not.toThrow();
  });

  it("should throw InvalidKeyError for missing keys", () => {
    const obj = { foo: "bar" };
    expect(() => assertKey(obj, "missing")).toThrow(InvalidKeyError);
  });

  it("should provide similar key suggestions", () => {
    const obj = { firstName: "John", lastName: "Doe" };
    try {
      assertKey(obj, "firstname");
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidKeyError);
      const keyError = error as InvalidKeyError<typeof obj>;
      expect(keyError.suggestions).toContain("firstName");
    }
  });

  it("should throw for null/undefined targets", () => {
    expect(() => assertKey(null as unknown as object, "key")).toThrow(AutomationError);
    expect(() => assertKey(undefined as unknown as object, "key")).toThrow(AutomationError);
  });

  it("should throw for invalid key types", () => {
    const obj = { foo: "bar" };
    expect(() => assertKey(obj, {} as unknown as string)).toThrow(AutomationError);
    expect(() => assertKey(obj, [] as unknown as string)).toThrow(AutomationError);
  });

  it("should include context in error messages", () => {
    const obj = { foo: "bar" };
    expect(() => assertKey(obj, "missing", "config")).toThrow("[config]");
  });

  it("should handle symbol keys", () => {
    const sym = Symbol("test");
    const obj = { [sym]: "value" };
    expect(() => assertKey(obj, sym)).not.toThrow();
  });

  it("does not include suggestions for missing non-string keys", () => {
    const sym = Symbol("present");
    const obj = { [sym]: "value" };
    expect(() => assertKey(obj, Symbol("missing"))).toThrow(InvalidKeyError);
    expect(() => assertKey(obj, Symbol("missing"))).toThrow("Key");
    expect(() => assertKey(obj, Symbol("missing"))).not.toThrow(/Did you mean/);
  });

  it("does not include suggestions when there are no candidate keys", () => {
    expect(() => assertKey({}, "anything")).toThrow(InvalidKeyError);
    expect(() => assertKey({}, "anything")).not.toThrow(/Did you mean/);
  });

  it("should handle numeric keys", () => {
    const arr = ["a", "b", "c"];
    expect(() => assertKey(arr, 0)).not.toThrow();
    expect(() => assertKey(arr, 1)).not.toThrow();
  });
});

describe("confirmKey", () => {
  it("should return true for existing keys", () => {
    const obj = { foo: "bar" };
    expect(confirmKey(obj, "foo")).toBe(true);
  });

  it("should return false for missing keys", () => {
    const obj = { foo: "bar" };
    expect(confirmKey(obj, "missing")).toBe(false);
  });

  it("should return false for null/undefined targets", () => {
    expect(confirmKey(null as unknown as object, "key")).toBe(false);
    expect(confirmKey(undefined as unknown as object, "key")).toBe(false);
  });

  it("should return false for invalid key types", () => {
    const obj = { foo: "bar" };
    expect(confirmKey(obj, {} as unknown as string)).toBe(false);
  });

  it("should work in type guard context", () => {
    const obj: Record<string, unknown> = { foo: "bar" };
    if (confirmKey(obj, "foo")) {
      // TypeScript should know foo exists
      const value = obj.foo;
      expect(value).toBe("bar");
    }
  });
});

describe("getKey", () => {
  it("should return value for existing keys", () => {
    const obj = { foo: "bar", num: 123 };
    expect(getKey(obj, "foo")).toBe("bar");
    expect(getKey(obj, "num")).toBe(123);
  });

  it("should throw for missing keys", () => {
    const obj = { foo: "bar" };
    expect(() => getKey(obj, "missing" as keyof typeof obj)).toThrow(InvalidKeyError);
  });

  it("should include context in error messages", () => {
    const obj = { foo: "bar" };
    expect(() => getKey(obj, "missing" as keyof typeof obj, "config")).toThrow("[config]");
  });

  it("should work with proper typing", () => {
    const obj = { foo: "bar", num: 123 };
    const foo: string = getKey(obj, "foo");
    const num: number = getKey(obj, "num");
    expect(foo).toBe("bar");
    expect(num).toBe(123);
  });
});
