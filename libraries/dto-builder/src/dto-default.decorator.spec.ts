import { describe, it, expect } from "vitest";
import { DefaultValueDecorators } from "./dto-default.decorator";
import { metadata } from "@autometa/injection";
import { DtoBuilderSymbols } from "./property.enum";
import { PropertyMetadata } from "./types";

class SubTestClass {
  @DefaultValueDecorators.value("test")
  a: string;
}
class TestClass {
  @DefaultValueDecorators.value(1)
  b: number;

  @DefaultValueDecorators.dto(SubTestClass)
  c: SubTestClass;

  @DefaultValueDecorators.factory(() => "test")
  d: string;
}

describe("DtoDefault", () => {
  it("should add a value as metadata", () => {
    const { b } = metadata(TestClass.prototype).getCustom<PropertyMetadata>(
      DtoBuilderSymbols.PROPERTY_DEFAULTS
    );
    expect(b).toHaveProperty("value");
    expect(b).toEqual({ value: 1 });
  });

  it("should add a dto as metadata", () => {
    const { c } = metadata(TestClass.prototype).getCustom<PropertyMetadata>(
      DtoBuilderSymbols.PROPERTY_DEFAULTS
    );
    expect(c).toHaveProperty("dtoType");
    expect(c).toEqual({ dtoType: SubTestClass });
  });

  it("should add a factory as metadata", () => {
    const { d } = metadata(TestClass.prototype).getCustom<PropertyMetadata>(
      DtoBuilderSymbols.PROPERTY_DEFAULTS
    );
    expect(d).toHaveProperty("factory");
    expect(d).toEqual({ factory: expect.any(Function) });
  });
});
