import { describe, expect, it } from "vitest";
import {
  AnySchema,
  BooleanSchema,
  NullSchema,
  NumberSchema,
  StringSchema,
  UndefinedSchema,
} from "./default-schema";
describe("Default Schema Functions", () => {
  describe("AnySchema", () => {
    it("should return the data", () => {
      expect(AnySchema(1)).toBe(1);
    });
  });

  describe("StringSchema", () => {
    it("should return the data", () => {
      expect(StringSchema("1")).toBe("1");
    });
  });

  describe("NumberSchema", () => {
    it("should return the data", () => {
      expect(NumberSchema(1)).toBe(1);
    });

    it("should return stringified data", () => {
      expect(NumberSchema("1")).toBe(1);
    });
  });

  describe("BooleanSchema", () => {
    it("should return the data", () => {
      expect(BooleanSchema(true)).toBe(true);
    });

    it("should return stringified data", () => {
      expect(BooleanSchema("true")).toBe(true);
    });
  });

  describe("NullSchema", () => {
    it("should return the data", () => {
      expect(NullSchema(null)).toBe(null);
    });

    it("should return the stringified data", () => {
      expect(NullSchema("null")).toBe(null);
    });

    it("should throw if the data is not null", () => {
      expect(() => NullSchema(1)).toThrow();
    });

    it("should throw if the data is not null", () => {
      expect(() => NullSchema(undefined)).toThrow();
    });
  });

  describe("UndefinedSchema", () => {
    it("should return the data", () => {
      expect(UndefinedSchema(undefined)).toBe(undefined);
    });

    it("should throw if the data is not undefined", () => {
      expect(() => UndefinedSchema(1)).toThrow();
    });

    it("should throw if the data is not undefined", () => {
      expect(() => UndefinedSchema(null)).toThrow();
    });
  });
});
