import { describe, it, expect } from "vitest";
import { number } from "./number-argument";
import { shape } from "./shape-argument";
import { string } from "./string-argument";
class TestClass {
  a: string;
  b: number;
}
describe("Shape Argument", () => {
  describe("assertions", () => {
    describe("assertObject", () => {
      it("should validate that the input value is an object", () => {
        const sut = shape({});
        sut.assertObject({});
        expect(sut.accumulator.length).toEqual(0);
      });

      it("should fail validation when the input value is a string", () => {
        const sut = shape("foo", {});
        sut.assertObject("");
        expect(sut.accumulator.length).toEqual(1);
        expect(sut.accumulator[0]).toEqual(
          "Arg[foo]: Expected value to be an object but was [type: string]: ''"
        );
      });
    });
    describe("assertExhaustive", () => {
      it("should accept unknown properties by default", () => {
        const sut = shape("shape", { a: string() });
        sut.assertExhaustive({ a: "", b: 1 });
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should validate that the input value is exhaustive", () => {
        const sut = shape("shape", { a: string() }, { exhaustive: true });
        sut.assertExhaustive({ a: "" });
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should fail validation when an unknown property is present", () => {
        const sut = shape("foo", { a: string() }, { exhaustive: true });
        sut.assertExhaustive({ a: "", b: number() });
        expect(sut.accumulator.length).toEqual(1);
        expect(sut.accumulator[0]).toEqual(
          "Arg[foo]: Argument value contains property 'b' which is not known for object with keys ['a']"
        );
      });
    });
    describe("assertShapeMatches", () => {
      it("should accept an empty shape", () => {
        const sut = shape("shape", {});
        sut.assertShapeMatches({});
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should accept an empty shape with unkown properties", () => {
        const sut = shape("shape", {});
        sut.assertShapeMatches({ a: "" });
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should fail validation if a property is the wrong type", () => {
        const sut = shape("shape", { a: string() }, { exhaustive: true });
        sut.assertShapeMatches({ a: 1 });
        expect(sut.accumulator.length).toEqual(2);
        expect(sut.accumulator.asString().trim())
          .toEqual(`Arg[shape]: Expected all properties to be valid but found:
   Property[a]: Expected argument to be of type 'string' but was: [number] 1`);
      });
      it("should fail validation if a property is missing", () => {
        const sut = shape("shape", { a: string() }, { exhaustive: true });
        sut.assertShapeMatches({ b: number() });
        expect(sut.accumulator.length).toEqual(2);
        expect(sut.accumulator.asString().trim())
          .toEqual(`Arg[shape]: Expected all properties to be valid but found:
   Property[a]: Expected string to be defined but found undefined
   Property[a]: Expected argument to be of type 'string' but was: [undefined] undefined`);
      });
    });

    describe("assertIsInstance", () => {
      it("should validate if a shape is an instance", () => {
        const sut = shape(
          "shape",
          { a: string(), b: number() },
          { instance: TestClass }
        );
        const tc = new TestClass();
        tc.a = "a";
        tc.b = 1;
        sut.assertIsInstance(tc);
        expect(sut.accumulator.length).toEqual(0);
      });
      it("should fail to validate if a shape is not an instance", () => {
        const sut = shape(
          "shape",
          { a: string(), b: number() },
          { instance: TestClass }
        );
        const tc = { a: "a", b: 1 };
        sut.assertIsInstance(tc);
        expect(sut.accumulator.length).toEqual(1);
      });
    });
  });
});
