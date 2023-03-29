import "reflect-metadata";
import { Property } from "./dto-decorators";
import { describe, it, expect } from "vitest";
class TestClass {
  @Property
  foo!: string;

  @Property("hi")
  bar!: string;
}
describe("Property", () => {
  it("should attach all property names as metadata", () => {
    const c = new TestClass();
    const meta = Reflect.getMetadata("dto:properties", c.constructor.prototype);
    expect(meta).toEqual(["foo", "bar"]);
  });
});

