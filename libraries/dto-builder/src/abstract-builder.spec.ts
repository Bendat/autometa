import { AbstractDtoBuilder } from "./abstract-builder";
import { Property } from "./dto-decorators";
import { describe, it, expect } from "vitest";
describe("AbstractDtoBuilder", () => {
  class TestDto {
    @Property
    name!: string;
  }

  class TestDtoBuilder extends AbstractDtoBuilder<TestDto> {
    name = (name: string) => this.set("name")(name);
    constructor(instance?: TestDto) {
      super(TestDto, instance);
    }
  }

  describe("set", () => {
    it("should set the value of `name` on the dto", () => {
      const dto = new TestDto();
      const builder = new TestDtoBuilder(dto);
      builder.name("bob");
      expect(dto.name).toBe("bob");
    });
    it("should set the value of `name` on the dto without instance", () => {
      const builder = new TestDtoBuilder();
      builder.name("bob");
      expect(builder.build().name).toBe("bob");
    });
  });

  describe("build", () => {
    it("should build a valid DTO", () => {
      const dto = new TestDto();
      const builder = new TestDtoBuilder(dto);
      const name = builder.name("bob").build().name;
      expect(name).toBe("bob");
    });

    it("should ignore validation errors when building with validate=false", () => {
      const dto = new TestDto();
      const builder = new TestDtoBuilder(dto);
      const name = builder.build(false).name;
      expect(name).toBe(undefined);
    });
  });
});
