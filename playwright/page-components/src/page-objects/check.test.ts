import 'reflect-metadata'
import { test } from "vitest";
export class Foo {
  x: () => number;
  declare y: number;
}

test("check", () => {
  console.log(new Foo().x);
  Foo.prototype.x = () => 2;
  Foo.prototype.y = 2;
  console.log(new Foo().y);
  console.log(JSON.stringify(new Foo()));
});
