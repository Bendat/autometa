import { describe, expect, it } from "vitest";
import { Builder } from "./interface-proxy";
import { DTO } from "./dto";
interface FlatObject {
  a: string;
  b: number;
}

interface NestedObject {
  a: string;
  b: number;
  c: FlatObject;
}
describe("InterfaceProxy", () => {
  it("build a flat interface into an object", () => {
    const builder = Builder<FlatObject>();
    const obj = builder.a("foo").b(1).build();
    expect(obj).toEqual({ a: "foo", b: 1 });
  });

  it("build a nested interface into an object", () => {
    const obj = Builder<NestedObject>()
      .a("foo")
      .b(1)
      .c(Builder<FlatObject>().a("bar").b(2).build())
      .build();
    expect(obj).toEqual({ a: "foo", b: 1, c: { a: "bar", b: 2 } });
  });

  it("should derive a builder, keeping set values", () => {
    const builder = Builder<FlatObject>();
    const obj = builder.a("foo").b(1).build();
    const derived = builder.derive();
    expect(derived).not.toBe(builder);
    expect(derived.build()).toEqual(obj);
  });
  it("should derive a builder, keeping set values but not mutating the original builder", () => {
    const builder = Builder<FlatObject>();
    const obj = builder.a("foo").b(1).build();
    const derived = builder.derive().a("bar");
    expect(derived).not.toBe(builder);
    expect(derived.build()).toEqual({ a: "bar", b: 1 });
    expect(builder.build()).toEqual(obj);
  });
});

describe("Class Builder", () => {
  class Foo {
    a: string;
    b: number;
  }

  class DefaultsFoo {
    @DTO.value("foo2")
    a1: string;
    @DTO.factory(() => 1)
    b1: number;
    date: Date;
  }

  class DefaultsTest {
    @DTO.value("foo1")
    a: string;
    @DTO.factory(() => 1)
    b: number;
    @DTO.dto(DefaultsFoo)
    c: DefaultsFoo;
  }
  class FooBuilder extends Builder(Foo) {}
  const symbol = Symbol("foo");
  class DefaultsTestFooBuilder extends Builder(DefaultsTest) {
    [symbol] = 3;
    method() {
      return 3;
    }
  }

  it("should have a custom method", () => {
    const builder = new DefaultsTestFooBuilder();
    expect(builder[symbol]).toBe(3);
    expect(builder.method()).toBe(3);
  });

  it("should be instanceof", () => {
    const builder = new FooBuilder();
    expect(builder).toBeInstanceOf(FooBuilder);
  });
  it("should build a class", () => {
    const foo = new FooBuilder().a("foo").b(1).build();
    expect(foo).toBeInstanceOf(Foo);
    expect(foo).toEqual({ a: "foo", b: 1 });
  });

  it("should get a value", () => {
    const foo = new FooBuilder().a("foo").a.value;
    expect(foo).toEqual("foo");
  });

  it("should assign a known value", () => {
    const foo = new FooBuilder().assign("a", "foo").a.value;
    expect(foo).toEqual("foo");
  });

  it("should assign an unknown value", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foo = (new FooBuilder().assign("c", "foo") as any).c.value;
    expect(foo).toEqual("foo");
  });

  it("should build with default values", () => {
    const foo = new DefaultsTestFooBuilder().build();
    const { a, b, c } = foo;
    const { a1, b1 } = c;
    expect(foo).toBeInstanceOf(DefaultsTest);
    expect(a).toEqual("foo1");
    expect(b).toEqual(1);
    expect(c).toBeInstanceOf(DefaultsFoo);
    expect(a1).toEqual("foo2");
    expect(b1).toEqual(1);
  });

  it("should create a a default dto", () => {
    const dto = DefaultsTestFooBuilder.default();
    expect(dto).toBeInstanceOf(DefaultsTest);
    expect(dto.a).toEqual("foo1");
    expect(dto.b).toEqual(1);
  });

  it("should create a builder from a partial dto", () => {
    const partial = { a: "foo1-a" };
    const builder = DefaultsTestFooBuilder.fromRaw(partial);
    const dto = builder.build();
    expect(builder).toBeInstanceOf(DefaultsTestFooBuilder);
    expect(dto).toBeInstanceOf(DefaultsTest);
    expect(dto.a).toEqual("foo1-a");
  });
});
