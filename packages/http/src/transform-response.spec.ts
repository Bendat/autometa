import { describe, it, expect } from "vitest";
import { transformResponse } from "./transform-response";

describe("transformResponse", () => {
  it("should transform a valid json string to an object", () => {
    const result = transformResponse(false, '{"foo":"bar"}');
    expect(result).toEqual({ foo: "bar" });
  });
  it('should transform plaintext "true" to a boolean', () => {
    const result = transformResponse(false, "true");
    expect(result).toEqual(true);
  });
  it('should transform plaintext "false" to a boolean', () => {
    const result = transformResponse(false, "false");
    expect(result).toEqual(false);
  });
  it("should transform plaintext integers to numbers", () => {
    const result = transformResponse(false, "123");
    expect(result).toEqual(123);
  });

  it("should transform plaintext floats to numbers", () => {
    const result = transformResponse(false, "123.456");
    expect(result).toEqual(123.456);
  });
  it("should return undefined for undefined", () => {
    const result = transformResponse(false, undefined);
    expect(result).toEqual(undefined);
  });
  it("should return null for null", () => {
    const result = transformResponse(false, null);
    expect(result).toEqual(null);
  });
  it("should throw an error for invalid json", () => {
    expect(() => transformResponse(false, "foo")).toThrow();
  });
  it("should return plain text if allowPlainText is true", () => {
    const result = transformResponse(true, "foo");
    expect(result).toEqual("foo");
  });
});
