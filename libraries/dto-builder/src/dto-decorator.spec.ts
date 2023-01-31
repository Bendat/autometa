import "reflect-metadata";
import { Property, getDtoPropertyDecorators } from "./dto-decorators";
import { describe, it, expect } from "vitest";
class TestClass {
  @Property
  foo!: string;

  @Property
  bar!: string;
}
describe("Property", () => {
  it("should attach all property names as metadata", () => {
    const c = new TestClass();
    const meta = getDtoPropertyDecorators(c);
    expect([...meta]).toEqual(["foo", "bar"]);
  });
});

