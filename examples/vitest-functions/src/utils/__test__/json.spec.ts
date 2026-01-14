import { describe, it, expect } from "vitest";
import { splitPath, resolveJsonPath, coercePrimitive, normalizeValue } from "../json";

describe("json utils", () => {
  describe("splitPath", () => {
    it("splits dot notation", () => {
      expect(splitPath("a.b.c")).toEqual(["a", "b", "c"]);
    });

    it("handles array notation", () => {
      expect(splitPath("users[0].name")).toEqual(["users", "0", "name"]);
    });

    it("handles mixed notation", () => {
      expect(splitPath("data[items][0].id")).toEqual(["data", "items", "0", "id"]);
    });

    it("returns empty array for empty string", () => {
      expect(splitPath("")).toEqual([]);
      expect(splitPath("   ")).toEqual([]);
    });
  });

  describe("resolveJsonPath", () => {
    const data = {
      users: [
        { id: 1, name: "Alice", address: { city: "Wonderland" } },
        { id: 2, name: "Bob" },
      ],
      meta: {
        page: 1,
        total: 10,
      },
    };

    it("resolves root", () => {
      expect(resolveJsonPath(data, "")).toBe(data);
      expect(resolveJsonPath(data, "$")).toBe(data);
    });

    it("resolves nested properties", () => {
      expect(resolveJsonPath(data, "meta.page")).toBe(1);
      expect(resolveJsonPath(data, "users[0].name")).toBe("Alice");
      expect(resolveJsonPath(data, "users[0].address.city")).toBe("Wonderland");
    });

    it("resolves array indices", () => {
      expect(resolveJsonPath(data, "users[1]")).toEqual({ id: 2, name: "Bob" });
    });

    it("returns undefined for missing paths", () => {
      expect(resolveJsonPath(data, "users[2]")).toBeUndefined();
      expect(resolveJsonPath(data, "meta.missing")).toBeUndefined();
      expect(resolveJsonPath(data, "users[0].address.zip")).toBeUndefined();
    });

    it("returns undefined when traversing through null/undefined", () => {
      const nullData = { value: null };
      expect(resolveJsonPath(nullData, "value.child")).toBeUndefined();
    });
  });

  describe("coercePrimitive", () => {
    it("coerces booleans", () => {
      expect(coercePrimitive("true")).toBe(true);
      expect(coercePrimitive("TRUE")).toBe(true);
      expect(coercePrimitive("false")).toBe(false);
    });

    it("coerces null/undefined", () => {
      expect(coercePrimitive("null")).toBe(null);
      expect(coercePrimitive("undefined")).toBe(undefined);
    });

    it("coerces numbers", () => {
      expect(coercePrimitive("123")).toBe(123);
      expect(coercePrimitive("-12.34")).toBe(-12.34);
    });

    it("coerces JSON objects/arrays", () => {
      expect(coercePrimitive('{"a":1}')).toEqual({ a: 1 });
      expect(coercePrimitive("[1, 2]")).toEqual([1, 2]);
    });

    it("coerces quoted strings", () => {
      expect(coercePrimitive('"hello"')).toBe("hello");
    });

    it("returns plain strings as is", () => {
      expect(coercePrimitive("hello")).toBe("hello");
      expect(coercePrimitive("123-abc")).toBe("123-abc");
    });

    it("handles timestamp placeholder", () => {
      expect(coercePrimitive("<timestamp>")).toEqual({ __placeholder: "timestamp" });
    });
  });

  describe("normalizeValue", () => {
    it("normalizes strings using coercePrimitive", () => {
      expect(normalizeValue("true")).toBe(true);
    });

    it("returns non-strings as is", () => {
      const obj = { a: 1 };
      expect(normalizeValue(obj)).toBe(obj);
      expect(normalizeValue(123)).toBe(123);
    });
  });
});
