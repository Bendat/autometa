import { test, expect } from "vitest";
type MixinType<T> = (base: Constructable) => T;

type Mixed<T, TAccumulator = unknown> = T extends [infer THead, ...infer TTail]
  ? THead extends (base: Constructable) => infer TReturn
    ? TReturn extends Constructable
      ? Mixed<TTail, TAccumulator & TReturn>
      : never
    : never
  : TAccumulator;

class MixinBuilder<T> {
  constructor(readonly baseSuperClass: Class<T>) {}

  with<T extends MixinType<any>[]>(...args: T): Mixed<T> {
    return args.reduce(
      (superClass, mixinFactory) => mixinFactory(superClass),
      this.baseSuperClass
    ) as unknown as Mixed<T>;
  }
}

interface Constructable {
  new (...args: any[]): any;
}

interface Class<T> {
  new (...args: any[]): T;
}

function FooMixin(base: Constructable) {
  return class Foo extends base {
    a = 1;
  };
}

function BarMixin(base: Constructable) {
  return class Bar extends base {
    b = "hello world";
  };
}

function ConfigurableMixin(name: string) {
  return function (base: Constructable) {
    return class Configurable extends base {
      name = name;
    };
  };
}

class Base {}

function MIX(): MixinBuilder<Base>;
function MIX<T extends Constructable>(base: T): MixinBuilder<T>;
function MIX(base?: Constructable): MixinBuilder<Constructable | Base> {
  return new MixinBuilder(base ?? Base);
}

class TestClass extends MIX().with(
  FooMixin,
  BarMixin,
  ConfigurableMixin("Bob"),
) {
  myClassMethod() {
    return "hello world";
  }
}
test("it should create a mixin of foo and bar", () => {
  const inst = new TestClass();
  expect(inst.a).toBe(1);
  expect(inst.b).toBe("hello world");
  expect(inst.name).toBe("Bob");
  expect(inst.myClassMethod()).toEqual("hello world");
});
