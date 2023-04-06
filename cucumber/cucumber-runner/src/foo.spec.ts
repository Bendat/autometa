import { test } from "vitest";
import { Property } from "@autometa/dto-builder";
class Foo {
  @Property
  bar: number;
}
test("foo", () => {
  console.log("were fooing");
});
