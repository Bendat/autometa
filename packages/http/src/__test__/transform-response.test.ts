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
});
