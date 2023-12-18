import { describe, it, expect } from "vitest";
import { Inject } from "./inject";
import { metadata } from "./metadata";

describe("injection", () => {
  class TestFoo {}
  class TestClass {
    @Inject.class(TestFoo)
    foo: TestFoo;
  }

  it("should register a class metadata", () => {
    const retrieved = metadata(TestClass.prototype).get("foo");
    expect(retrieved).toEqual({
      key: "foo",
      class: TestFoo
    });
  });

  it('should register a value as metadata', ()=>{
    class TestClass {
      @Inject.value('foo')
      foo: string;
    }

    const retrieved = metadata(TestClass.prototype).get("foo");
    expect(retrieved).toEqual({
      key: "foo",
      value: 'foo'
    });
  })
});
