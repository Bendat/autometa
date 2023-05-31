import { describe, expect, it } from "vitest";
import { instance, InstanceArgument } from "./instance-argument";
import { number } from "./number-argument";
import { shape } from "./shape-argument";
class Foo {
  constructor(readonly a: number, readonly b: string) {}
}
class Bar {}
describe("Instance Argument", () => {
  describe("Assertions", () => {
    describe("assertDefined", () => {
      it("should pass when undefined is permitted", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const arg: InstanceArgument<any, any> = instance(
          Foo,
          undefined,
          {
            optional: true,
          }
        );
        arg.baseAssertions(undefined);
        expect(arg.accumulator).toHaveLength(0);
      });
    });
    describe("assertIsInstance", () => {
      it("should validate that a value is an instance of a class", () => {
        const arg = instance(Foo);
        arg.assertIsInstance(new Foo(1, "hi"));
        expect(arg.accumulator).toHaveLength(0);
      });
      it("should validate that a value is not an instance of a class", () => {
        const arg = instance(Foo);
        arg.assertIsInstance(new Bar());
        expect(arg.accumulator).toHaveLength(1);
        expect(arg.accumulator[0]).toEqual(
          "Arg[unnamed arg]: Expected value of [object Object] to be an instance of Foo but it was not."
        );
      });
      describe("assertShapeArguments", () => {
        it("should validate the instance matches the provided shape", () => {
          const arg = instance(Foo, shape({ a: number() }));
          arg.assertShapeArguments(new Foo(1, "hi"));
          expect(arg.accumulator).toHaveLength(0);
        });
        it("should validate the instance does not matches the provided shape", () => {
          const arg = instance(Foo, shape({ a: number() }));
          arg.assertShapeArguments(new Foo("hi" as unknown as number, "hi"));
          expect(arg.accumulator).toHaveLength(1);
          expect(arg.accumulator.asString().trim())
            .toEqual(`Arg[unnamed arg]: Expected all properties to be valid but found:
      Property[a]: Expected value to be a number but was [string]: hi`);
        });
      });
    });
  });
});
