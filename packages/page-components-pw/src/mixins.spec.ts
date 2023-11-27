import { describe, it, expect, Constructable } from "vitest";
import { Behavior } from "./mixins";
import { Component } from "./component";

const Mixin1 = (base: Constructable) =>
  class Mixin1 extends base {
    m1 = 1;
  };

const Mixin2 = (base: Constructable) =>
  class Mixin2 extends base {
    m2 = 2;
  };

class Composed extends Behavior(Mixin1, Mixin2) {}

describe("mixins", () => {
  it("should compose mixins", () => {
    const c = new Composed();
    expect(c.m1).toBe(1);
    expect(c.m2).toBe(2);
    expect(c).toBeInstanceOf(Component);
  });
});
