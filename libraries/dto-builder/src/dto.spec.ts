import { describe, it, expect } from "vitest";
import { DTO, DTOWrapper } from "./dto";
import { metadata } from "@autometa/injection";
import { DtoBuilderSymbols } from "./property.enum";
import { PropertyMetadata } from "./types";
interface TestDtoType {
  a: string;
  b: number;
}
class TestDto extends DTOWrapper<TestDtoType>() {}
describe("DTOWrapper", () => {
  it("should implement the interface explicitely", () => {
    const dto = new TestDto();
    dto.a = "test";
    dto.b = 1;
    expect(dto).toEqual({ a: "test", b: 1 });
  });
});

class TestDto2 extends DTO<TestDtoType>() {
  @DTO.value("test")
  a: string;
}

describe("DTO", () => {
  it("should behave the same as the wrapper function", () => {
    const dto = new TestDto2();
    dto.a = "test";
    dto.b = 1;
    expect(dto).toEqual({ a: "test", b: 1 });
  });

  it("should contain default value metadata", () => {
    const { a } = metadata(TestDto2.prototype).getCustom<PropertyMetadata>(
      DtoBuilderSymbols.PROPERTY_DEFAULTS
    );
    expect(a).toHaveProperty("value");
    expect(a).toEqual({ value: "test" });
  });
});
