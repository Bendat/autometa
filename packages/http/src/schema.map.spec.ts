import { describe, it, expect } from "vitest";
import { SchemaMap } from "./schema.map";
import { SchemaParser, StatusCode } from "./types";

describe("SchemaMap", () => {
  describe("register", () => {
    describe("single status", () => {
      it("should register a single status code", () => {
        const map = new SchemaMap();
        const parser: SchemaParser = { parse: <T>(data: T) => data };
        const parse = map.register(parser, 200);
        const parsed = parse({ foo: "bar" });
        expect(parsed).toEqual({ foo: "bar" });
      });
      it("should throw if the status code is already registered", () => {
        const map = new SchemaMap();
        const parser: SchemaParser = { parse: <T>(data: T) => data };
        map.register(parser, 200);
        expect(() => map.register(parser, 200)).toThrow();
      });

      it("should throw if the status code is invalid", () => {
        const map = new SchemaMap();
        const parser: SchemaParser = { parse: <T>(data: T) => data };
        expect(() => map.register(parser, 0 as 200)).toThrow();
      });
    });
    describe("range of statuses", () => {
      it("should register a range of statuses", () => {
        const map = new SchemaMap();
        const parser: SchemaParser = { parse: <T>(data: T) => data };
        const parse = map.register(parser, { from: 200, to: 202 });
        const parsed = parse({ foo: "bar" });
        expect(parsed).toEqual({ foo: "bar" });
      });
      it("should throw if the status code is already registered", () => {
        const map = new SchemaMap();
        const parser: SchemaParser = { parse: <T>(data: T) => data };
        map.register(parser, { from: 200, to: 202 });
        expect(() => map.register(parser, { from: 200, to: 202 })).toThrow();
      });

      it("should throw if the from status code is invalid", () => {
        const map = new SchemaMap();
        const parser: SchemaParser = { parse: <T>(data: T) => data };
        expect(() =>
          map.register(parser, { from: 0 as StatusCode, to: 202 })
        ).toThrow();
      });

      it("should throw if the to status code is invalid", () => {
        const map = new SchemaMap();
        const parser: SchemaParser = { parse: <T>(data: T) => data };
        expect(() =>
          map.register(parser, { from: 200, to: 0 as StatusCode })
        ).toThrow();
      });
    });
  });
  describe("validate", () => {
    it("should return the parser for the status code", () => {
      const map = new SchemaMap();
      const parser: SchemaParser = { parse: <T>(data: T) => data };
      map.register(parser, 200);
      const validate = map.validate(200, { foo: "bar" });
      expect(validate).toEqual({ foo: "bar" });
    });

    it("should throw if the status code is not registered", () => {
      const map = new SchemaMap();
      expect(() => map.validate(200, { foo: "bar" })).toThrow();
    });
  });
});
