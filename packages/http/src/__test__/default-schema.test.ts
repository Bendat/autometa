import { describe, expect, it } from "vitest";
import {
  AnySchema,
  BooleanSchema,
  EmptySchema,
  JSONSchema,
  NullSchema,
  NumberSchema,
  StringSchema,
  UndefinedSchema,
} from "../default-schema";

describe("Default Schemas", () => {
  describe("AnySchema", () => {
    it("returns input as is", () => {
      expect(AnySchema(1)).toBe(1);
      expect(AnySchema("foo")).toBe("foo");
      expect(AnySchema(null)).toBeNull();
    });
  });

  describe("EmptySchema", () => {
    it("accepts null", () => {
      expect(EmptySchema(null)).toBeNull();
    });
    it("accepts undefined", () => {
      expect(EmptySchema(undefined)).toBeUndefined();
    });
    it("accepts 'null' string", () => {
      expect(EmptySchema("null")).toBeNull();
    });
    it("throws on other values", () => {
      expect(() => EmptySchema(1)).toThrow("Expected null but received <number> 1");
    });
  });

  describe("NullSchema", () => {
    it("accepts null", () => {
      expect(NullSchema(null)).toBeNull();
    });
    it("accepts 'null' string", () => {
      expect(NullSchema("null")).toBeNull();
    });
    it("throws on undefined", () => {
      expect(() => NullSchema(undefined)).toThrow("Expected null but received <undefined> undefined");
    });
    it("throws on other values", () => {
      expect(() => NullSchema(1)).toThrow("Expected null but received <number> 1");
    });
  });

  describe("UndefinedSchema", () => {
    it("accepts undefined", () => {
      expect(UndefinedSchema(undefined)).toBeUndefined();
    });
    it("throws on null", () => {
      expect(() => UndefinedSchema(null)).toThrow("Expected undefined but received <object> null");
    });
    it("throws on other values", () => {
      expect(() => UndefinedSchema(1)).toThrow("Expected undefined but received <number> 1");
    });
  });

  describe("BooleanSchema", () => {
    it("accepts boolean", () => {
      expect(BooleanSchema(true)).toBe(true);
      expect(BooleanSchema(false)).toBe(false);
    });
    it("accepts string boolean", () => {
      expect(BooleanSchema("true")).toBe(true);
      expect(BooleanSchema("false")).toBe(false);
    });
    it("throws on other values", () => {
      expect(() => BooleanSchema(1)).toThrow("Expected boolean but received <number> 1");
    });
  });

  describe("NumberSchema", () => {
    it("accepts number", () => {
      expect(NumberSchema(1)).toBe(1);
      expect(NumberSchema(1.5)).toBe(1.5);
    });
    it("accepts string number", () => {
      expect(NumberSchema("1")).toBe(1);
      expect(NumberSchema("1.5")).toBe(1.5);
    });
    it("throws on non-numeric string", () => {
      expect(() => NumberSchema("foo")).toThrow("Expected number but received <string> foo");
    });
    it("throws on other values", () => {
      expect(() => NumberSchema(true)).toThrow("Expected number but received <boolean> true");
    });
  });

  describe("StringSchema", () => {
    it("accepts string", () => {
      expect(StringSchema("foo")).toBe("foo");
    });
    it("throws on other values", () => {
      expect(() => StringSchema(1)).toThrow("Expected string but received <number> 1");
    });
  });

  describe("JSONSchema", () => {
    it("accepts object", () => {
      const obj = { foo: "bar" };
      expect(JSONSchema(obj)).toBe(obj);
    });
    it("accepts json string", () => {
      expect(JSONSchema('{"foo":"bar"}')).toEqual({ foo: "bar" });
    });
    it("throws on invalid json string", () => {
      expect(() => JSONSchema("{foo")).toThrow("Expected JSON but received <string> {foo");
    });
    it("throws on other values", () => {
      expect(() => JSONSchema(1)).toThrow("Expected JSON but received <number> 1");
    });
  });
});
