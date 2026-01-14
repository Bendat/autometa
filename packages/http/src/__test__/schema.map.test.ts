import { describe, expect, it, vi } from "vitest";
import { SchemaMap } from "../schema.map";
import type { StatusCode } from "../types";

describe("SchemaMap", () => {
  it("registers and retrieves parser by status code", () => {
    const map = new SchemaMap();
    const parser = vi.fn((data) => data);
    map.registerStatus(parser, 200 as StatusCode);
    
    expect(map.getParser(200 as StatusCode, false)).toBe(parser);
    expect(map.getParser(404 as StatusCode, false)).toBeNull();
  });

  it("registers and retrieves parser by range", () => {
    const map = new SchemaMap();
    const parser = vi.fn((data) => data);
    map.registerRange(parser, 200 as StatusCode, 202 as StatusCode);
    
    expect(map.getParser(200 as StatusCode, false)).toBe(parser);
    expect(map.getParser(201 as StatusCode, false)).toBe(parser);
    expect(map.getParser(202 as StatusCode, false)).toBe(parser);
    expect(map.getParser(203 as StatusCode, false)).toBeNull();
  });

  it("derives a copy", () => {
    const map = new SchemaMap();
    const parser = vi.fn();
    map.registerStatus(parser, 200 as StatusCode);
    
    const derived = map.derive();
    expect(derived.getParser(200 as StatusCode, false)).toBe(parser);
    
    derived.registerStatus(vi.fn(), 404 as StatusCode);
    expect(map.getParser(404 as StatusCode, false)).toBeNull();
  });

  it("validates using function parser", () => {
    const map = new SchemaMap();
    const parser = vi.fn((data) => ({ ...data, validated: true }));
    map.registerStatus(parser, 200 as StatusCode);
    
    const result = map.validate(200 as StatusCode, { foo: "bar" }, false);
    expect(result).toEqual({ foo: "bar", validated: true });
    expect(parser).toHaveBeenCalledWith({ foo: "bar" });
  });

  it("validates using object with parse method", () => {
    const map = new SchemaMap();
    const parser = { parse: vi.fn((data) => ({ ...data, parsed: true })) };
    map.registerStatus(parser, 200 as StatusCode);
    
    const result = map.validate(200 as StatusCode, { foo: "bar" }, false);
    expect(result).toEqual({ foo: "bar", parsed: true });
    expect(parser.parse).toHaveBeenCalledWith({ foo: "bar" });
  });

  it("validates using object with validate method", () => {
    const map = new SchemaMap();
    const parser = { validate: vi.fn((data) => ({ ...data, validated: true })) };
    map.registerStatus(parser, 200 as StatusCode);
    
    const result = map.validate(200 as StatusCode, { foo: "bar" }, false);
    expect(result).toEqual({ foo: "bar", validated: true });
    expect(parser.validate).toHaveBeenCalledWith({ foo: "bar" });
  });

  it("returns data as is if no parser and requireSchema is false", () => {
    const map = new SchemaMap();
    const result = map.validate(200 as StatusCode, { foo: "bar" }, false);
    expect(result).toEqual({ foo: "bar" });
  });

  it("throws if no parser and requireSchema is true", () => {
    const map = new SchemaMap();
    expect(() => map.validate(200 as StatusCode, { foo: "bar" }, true))
      .toThrow("No schema parser registered for status code 200 while requireSchema is true");
  });

  it("converts to object", () => {
    const map = new SchemaMap();
    const parser = vi.fn();
    map.registerStatus(parser, 200 as StatusCode);
    
    expect(map.toObject()).toEqual({ 200: parser });
  });
});
