import { describe, it, expect } from "vitest";
import { metadata } from "./metadata";
describe("metadata", () => {
  class TestProperty {
    name = "foo";
  }
  class Test {
    declare test: TestProperty;
  }
  it("should set metadata for a class field of type class", () => {
    metadata(Test).set({
      key: "test",
      class: TestProperty
    });

    const meta = metadata(Test).get("test");
    expect(meta).toEqual({
      key: "test",
      class: TestProperty
    });
  });

  it("should set metadata for a class field of type instance", () => {
    const instance = new TestProperty();
    metadata(Test).set({
      key: "test",
      value: instance
    });
    const meta = metadata(Test).get("test");

    expect(meta).toEqual({
      key: "test",
      value: instance
    });
  });

  it("should get metadata for a class field of type class", () => {
    metadata(Test).set({
      key: "test",
      class: TestProperty
    });

    expect(metadata(Test).get("test")).toEqual({
      key: "test",
      class: TestProperty
    });
  });

  it("should get metadata for a class field of type instance", () => {
    const instance = new TestProperty();
    metadata(Test).set({
      key: "test",
      value: instance
    });

    expect(metadata(Test).get("test")).toEqual({
      key: "test",
      value: instance
    });
  });
});
