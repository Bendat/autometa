import { describe, it, expect } from "vitest";
import { metadata } from "./metadata";
import { AutometaSymbol } from "./symbol";
describe("metadata", () => {
  class TestProperty {
    name = "foo";
  }
  class Test {
    declare test: TestProperty;
  }
  it("should set metadata for a class field of type class", () => {
    metadata(Test.prototype).set({
      key: "test",
      class: TestProperty
    });

    const test = new Test();

    expect(test[AutometaSymbol.META_DATA].test).toEqual({
      key: "test",
      class: TestProperty
    });
  });

  it("should set metadata for a class field of type instance", () => {
    const instance = new TestProperty();
    metadata(Test.prototype).set({
      key: "test",
      value: instance
    });

    const test = new Test();

    expect(test[AutometaSymbol.META_DATA].test).toEqual({
      key: "test",
      value: instance
    });
  });

  it("should get metadata for a class field of type class", () => {
    metadata(Test.prototype).set({
      key: "test",
      class: TestProperty
    });

    expect(metadata(Test.prototype).get("test")).toEqual({
      key: "test",
      class: TestProperty
    });
  });

  it("should get metadata for a class field of type instance", () => {
    const instance = new TestProperty();
    metadata(Test.prototype).set({
      key: "test",
      value: instance
    });

    expect(metadata(Test.prototype).get("test")).toEqual({
      key: "test",
      value: instance
    });
  });
});
