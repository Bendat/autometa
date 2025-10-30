import { describe, it, expect } from "vitest";
import { lie, unsafeCast } from "../type-cast.js";

describe("lie", () => {
  it("should not throw for any value", () => {
    expect(() => lie<string>(123)).not.toThrow();
    expect(() => lie<number>("hello")).not.toThrow();
    expect(() => lie<object>(null)).not.toThrow();
  });

  it("should perform type assertion", () => {
    const value: unknown = { name: "John" };
    lie<{ name: string }>(value);
    // TypeScript should now treat value as { name: string }
    // Note: This is unsafe and should be used with caution
  });
});

describe("unsafeCast", () => {
  it("should cast any value to target type", () => {
    const num = unsafeCast<number>("123");
    expect(num).toBe("123"); // Still a string at runtime!
  });

  it("should not perform runtime validation", () => {
    const obj = unsafeCast<{ foo: string }>({ bar: 123 });
    expect(obj).toEqual({ bar: 123 }); // Original value unchanged
  });

  it("should work with complex types", () => {
    interface User {
      id: number;
      name: string;
    }
    const data: unknown = { id: 1, name: "Alice" };
    const user = unsafeCast<User>(data);
    expect(user.id).toBe(1);
    expect(user.name).toBe("Alice");
  });
});
