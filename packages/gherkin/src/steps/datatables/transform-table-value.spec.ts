import { describe, it, expect } from "vitest";
import { transformTableValue } from "./transform-table-value";
import { ExampleBuilder } from "../../example";
describe("transforming a table string value to a JavaScript typed value", () => {
  it("should transform a string to a string", () => {
    expect(transformTableValue("foo")).toBe("foo");
  });
  it("should transform a number to a number", () => {
    expect(transformTableValue("42")).toBe(42);
  });
  it("should transform a boolean to a boolean", () => {
    expect(transformTableValue("true")).toBe(true);
    expect(transformTableValue("false")).toBe(false);
  });
  describe("interpolating example", () => {
    it("should interpolate table values", () => {
      const example = new ExampleBuilder()
        .attach("table", "a", "hello")
        .attach("table", "b", "2")
        .build();
      expect(transformTableValue("<a>", example)).toBe("hello");
      expect(transformTableValue("<b>", example)).toBe(2);
    });
  });
});
