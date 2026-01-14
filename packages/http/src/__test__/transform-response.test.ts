import { describe, expect, it } from "vitest";
import { transformResponse } from "../transform-response";

describe("transformResponse", () => {
  it("treats empty string bodies as undefined regardless of plain text setting", () => {
    expect(transformResponse(false, "")).toBeUndefined();
    expect(transformResponse(true, "")).toBeUndefined();
    expect(transformResponse(true, "   ")).toBeUndefined();
  });

  it("returns plain text when non-empty and allowed", () => {
    expect(transformResponse(true, "hello")).toBe("hello");
  });

  it("throws when JSON parsing fails but plain text disallowed", () => {
    expect(() => transformResponse(false, "not-json")).toThrowError();
  });

  it("returns null/undefined as is", () => {
    expect(transformResponse(false, null)).toBeNull();
    expect(transformResponse(false, undefined)).toBeUndefined();
  });

  it("returns undefined for 'undefined' string", () => {
    expect(transformResponse(false, "undefined")).toBeUndefined();
    expect(transformResponse(false, "UNDEFINED")).toBeUndefined();
  });

  it("parses boolean strings", () => {
    expect(transformResponse(false, "true")).toBe(true);
    expect(transformResponse(false, "false")).toBe(false);
  });

  it("parses number strings", () => {
    expect(transformResponse(false, "123")).toBe(123);
    expect(transformResponse(false, "12.34")).toBe(12.34);
  });

  it("parses JSON strings", () => {
    expect(transformResponse(false, '{"foo":"bar"}')).toEqual({ foo: "bar" });
    expect(transformResponse(false, '[1,2,3]')).toEqual([1, 2, 3]);
  });

  it("returns objects as is", () => {
    const obj = { foo: "bar" };
    expect(transformResponse(false, obj)).toBe(obj);
  });

  it("returns boolean/number primitives as is", () => {
    expect(transformResponse(false, true)).toBe(true);
    expect(transformResponse(false, 123)).toBe(123);
  });

  it("handles ArrayBuffer", () => {
    const buffer = new TextEncoder().encode('{"foo":"bar"}').buffer;
    expect(transformResponse(false, buffer)).toEqual({ foo: "bar" });
  });

  it("handles ArrayBufferView", () => {
    const view = new TextEncoder().encode('{"foo":"bar"}');
    expect(transformResponse(false, view)).toEqual({ foo: "bar" });
  });

  it("handles ArrayBuffer with plain text", () => {
    const buffer = new TextEncoder().encode('hello').buffer;
    expect(transformResponse(true, buffer)).toBe("hello");
  });

  it("uses fallback bufferToString if TextDecoder is missing", () => {
    const originalTextDecoder = globalThis.TextDecoder;
    Object.defineProperty(globalThis, 'TextDecoder', { value: undefined, writable: true });

    try {
      const bytes = new Uint8Array([123, 34, 102, 111, 111, 34, 58, 34, 98, 97, 114, 34, 125]); // {"foo":"bar"}
      expect(transformResponse(false, bytes.buffer)).toEqual({ foo: "bar" });
    } finally {
      globalThis.TextDecoder = originalTextDecoder;
    }
  });
});
