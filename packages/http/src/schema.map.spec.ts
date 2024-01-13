import { describe, it, expect } from "vitest";
import { SchemaMap } from "./schema.map";

describe("SchemaMap", () => {
  describe("register", () => {
    describe("single status", () => {
      it("should register a single status code", () => {
        const map = new SchemaMap();
        const parser = { parse: (data: unknown) => data };
        map.registerStatus(parser, 200);
        const retrieved = map.getParser(200, false);
        expect(retrieved).toBe(parser);
      });

      it("should throw if the status code is already registered", () => {
        const map = new SchemaMap();
        const parser = { parse: <T>(data: T) => data };
        map.registerStatus(parser, 200);
        expect(() => map.registerStatus(parser, 200)).toThrow();
      });
    });

    describe("range of statuses", () => {
      it("should register a range of statuses", () => {
        const map = new SchemaMap();
        const parser = { parse: <T>(data: T) => data };
        map.registerRange(parser, 200, 202);
        const retrieved = map.getParser(200, false);
        expect(retrieved).toBe(parser);
      });

      it("should throw if the status code is already registered", () => {
        const map = new SchemaMap();
        const parser = { parse: <T>(data: T) => data };
        map.registerRange(parser, 200, 202);
        expect(() => map.registerRange(parser, 200, 202)).toThrow();
      });
    });

    describe("derive", () => {
      it("should return a new map with the same values", () => {
        const map = new SchemaMap();
        const parser = { parse: <T>(data: T) => data };
        map.registerRange(parser, 200, 202);
        const derived = map.derive();
        expect(derived.getParser(200, false)).toBe(parser);
      });
    });
  });
});
