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
  it("should create a valid builder", () => {
    const builder = new FooBuilder();
    const dto = builder.fooHast("aa").fooHastMich("bb").build();
    const { fooHast, fooHastMich } = dto;
    expect(fooHast).toBe("aa");
    expect(fooHastMich).toBe("bb");
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
