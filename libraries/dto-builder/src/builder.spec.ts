import { IsOptional, IsString } from "class-validator";
import { Builder } from "./builder";
import { Property } from "./dto-decorators";
import { describe, it, expect } from "vitest";
class Bar {
  @Property(1)
  id: number;
}
class Foo {
  @IsString()
  @Property
  fooHast!: string;

  @IsOptional()
  @IsString()
  @IsOptional()
  @Property
  fooHastMich?: string;

  @Property(Bar)
  bar: Bar;
  @Property(1)
  baz: number;
  @Property((value: string) => Number(value))
  mapped: number;
}

describe("makeDtoBuilder", () => {
  const FooBuilder = Builder<Foo>(Foo);
  it("should have default values", () => {
    const dto = FooBuilder.default();
    expect(dto.fooHast).toEqual(undefined);
    expect(dto.fooHastMich).toEqual(undefined);
    expect(dto.bar).instanceOf(Bar);
    expect(dto.bar.id).toBe(1);
    expect(dto.baz).toEqual(1);
  });
  it("should build from raw", () => {
    const raw: Foo = {
      fooHast: "bruh",
      fooHastMich: "duh",
      bar: { id: 1 },
      baz: 1,
      mapped: "1" as unknown as number,
    };
    const dto = FooBuilder.fromRaw(raw, true);
    expect(dto).toBeInstanceOf(Foo);
    expect(dto.fooHast).toEqual("bruh");
    expect(dto.fooHastMich).toEqual("duh");
    expect(dto.bar).instanceOf(Bar);
    expect(dto.bar.id).toEqual(1);
    expect(dto.baz).toEqual(1);
    expect(dto.mapped).toEqual(1);
  });

  it("should build from raw", () => {
    const raw: Foo = {
      fooHast: lie(undefined),
      fooHastMich: "duh",
      bar: { id: 1 },
      baz: 1,
      mapped: "1" as unknown as number,
    };
    const dto = () => FooBuilder.fromRaw(raw, true);
    expect(dto).toThrow(`An instance of Foo has failed the validation:
 - property fooHast has failed the following constraints: isString`);
  });
  
  it("should create a valid builder", () => {
    const builder = new FooBuilder();
    const dto = builder.fooHast("aa").fooHastMich("bb").build();
    const { fooHast, fooHastMich } = dto;
    expect(fooHast).toBe("aa");
    expect(fooHastMich).toBe("bb");
  });

  it("should retrieve a value", () => {
    const builder = new FooBuilder();
    const value = builder.fooHast("aa").fooHast.value;
    expect(value).toEqual("aa");
  });

  it("Should fail due to validation errors", () => {
    const builder = new FooBuilder();
    const dto = () => builder.fooHastMich("bb").build();
    expect(dto).toThrow(`An instance of Foo has failed the validation:
 - property fooHast has failed the following constraints: isString`);
  });

  it("Should allow optional properties", () => {
    const builder = new FooBuilder();
    const dto = builder.fooHast("aa").build();
    const { fooHast, fooHastMich } = dto;

    expect(fooHast).toBe("aa");
    expect(fooHastMich).toBe(undefined);
  });
});

export function lie<T>(input: unknown): T {
  return input as T;
}
