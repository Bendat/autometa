import { describe, it, expect } from "vitest";
import {
  EnvironmentSchema,
  RunnerSchema,
  TagFilterSchema,
  TestSchema,
  TimeoutSchema,
} from "./config.schema";
describe("TestExecutorConfigSchema", () => {
  describe("Configured runner schema should be a literal value", () => {
    it("should match the literal value 'jest'", () => {
      expect(() => RunnerSchema.parse("jest")).not.toThrow();
    });
    it("should match the literal value 'vitest'", () => {
      expect(() => RunnerSchema.parse("vitest")).not.toThrow();
    });
    it("should not match the literal value 'foo'", () => {
      expect(() => RunnerSchema.parse("foo")).toThrow();
    });
  });
  describe("Configured environment schema should be a string value", () => {
    it("should match the string value 'foo'", () => {
      expect(() => EnvironmentSchema.parse("foo")).not.toThrow();
    });
    it("should match the string value 'bar'", () => {
      expect(() => EnvironmentSchema.parse("bar")).not.toThrow();
    });
    it("should not match the number value 123", () => {
      expect(() => EnvironmentSchema.parse(123)).toThrow();
    });
  });
  describe("Configured timeout schema should be a number value", () => {
    it("should match the number value 123", () => {
      expect(() => TimeoutSchema.parse(123)).not.toThrow();
    });
    it("should match the number value 456", () => {
      expect(() => TimeoutSchema.parse(456)).not.toThrow();
    });
    it("should not match the string value 'foo'", () => {
      expect(() => TimeoutSchema.parse("foo")).toThrow();
    });
  });
  describe("Configured tag filter schema should be a string value", () => {
    it("should match the string value '@foo'", () => {
      expect(() => TagFilterSchema.parse("@foo")).not.toThrow();
    });
    it("should not match the string value 'bar'", () => {
      expect(() => TagFilterSchema.parse("bar")).toThrow();
    });
    it("should not match the number value 123", () => {
      expect(() => TagFilterSchema.parse(123)).toThrow();
    });
  });
  describe("Configured test schema", () => {
    it("should match the a valid test object with timeout and filter", () => {
      expect(() =>
        TestSchema.parse({
          timeout: 123,
          tagFilter: "@foo",
        })
      ).not.toThrow();
    });
  });
});
