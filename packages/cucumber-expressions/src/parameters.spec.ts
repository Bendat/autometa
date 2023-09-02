import {
  CucumberExpression,
  ParameterTypeRegistry
} from "@cucumber/cucumber-expressions";
import { describe, it, expect } from "vitest";
import { defineParameterType } from "./parameters";
import { AssertDefined } from "@autometa/asserters";
import { BooleanParam, DateParam, PrimitiveParam } from "./default.parameters";
class Foo {
  constructor(public name?: string) {}
}
class FooNum {
  constructor(public name?: number) {}
}
describe("defineParameterType", () => {
  describe("type", () => {
    it("should add a parameter with a type and transform function", () => {
      const registry = new ParameterTypeRegistry();
      const expected = new Foo("foo");
      defineParameterType(registry, {
        name: "number",
        regexpPattern: /\d+/,
        type: Foo,
        transform: (s: unknown) => {
          const foo = s as Foo;
          foo.name = "foo";
          return foo;
        }
      });
      const expression = new CucumberExpression(
        "I have {number} cukes in my belly now",
        registry
      );
      const args = expression.match("I have 7 cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      const value = arg.getValue(arg) as Foo;
      expect(value).toEqual(expected);
    });
    it("should add a parameter with a type and no transform function", () => {
      const registry = new ParameterTypeRegistry();
      const expected = new Foo("7");
      defineParameterType(registry, {
        name: "number",
        regexpPattern: /\d+/,
        type: Foo
      });
      const expression = new CucumberExpression(
        "I have {number} cukes in my belly now",
        registry
      );
      const args = expression.match("I have 7 cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      const value = arg.getValue(arg) as Foo;
      expect(value).toEqual(expected);
    });
  });
  describe("primitive", () => {
    it("should add a parameter with a primitive and a transform function", () => {
      const registry = new ParameterTypeRegistry();
      const expected = 14;
      defineParameterType(registry, {
        name: "number",
        regexpPattern: /\d+/,
        primitive: Number,
        transform: (s: unknown) => {
          const foo = s as number;
          return foo * 2;
        }
      });
      const expression = new CucumberExpression(
        "I have {number} cukes in my belly now",
        registry
      );
      const args = expression.match("I have 7 cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      const value = arg.getValue(arg) as number;
      expect(value).toEqual(expected);
    });
    it("should add a parameter with a primitive and no transform function", () => {
      const registry = new ParameterTypeRegistry();
      const expected = 7;
      defineParameterType(registry, {
        name: "number",
        regexpPattern: /\d+/,
        primitive: Number
      });
      const expression = new CucumberExpression(
        "I have {number} cukes in my belly now",
        registry
      );
      const args = expression.match("I have 7 cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      const value = arg.getValue(arg) as number;
      expect(value).toEqual(expected);
    });
    it("should add a parameter with a primitive, type and transform function", () => {
      const registry = new ParameterTypeRegistry();
      const expected = 7;
      defineParameterType(registry, {
        name: "number",
        regexpPattern: /\d+/,
        primitive: Number,
        type: FooNum,
        transform: (s: unknown) => {
          const foo = s as FooNum;
          return foo.name;
        }
      });
      const expression = new CucumberExpression(
        "I have {number} cukes in my belly now",
        registry
      );
      const args = expression.match("I have 7 cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      const value = arg.getValue(arg) as number;
      expect(value).toEqual(expected);
    });
  });
  describe("transform", () => {
    it("should add a parameter with no type and a transform function", () => {
      const registry = new ParameterTypeRegistry();
      const expected = new Foo("7");
      defineParameterType(registry, {
        name: "number",
        regexpPattern: /\d+/,
        transform: (s: unknown) => {
          const foo = s as string;
          const f = new Foo(foo);
          f.name = foo;
          return f;
        }
      });
      const expression = new CucumberExpression(
        "I have {number} cukes in my belly now",
        registry
      );
      const args = expression.match("I have 7 cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      const value = arg.getValue(arg) as Foo;
      expect(value).toEqual(expected);
    });
  });
  it("should return a string if no primitive, type or transform is provided", () => {
    const registry = new ParameterTypeRegistry();
    const expected = "boo";
    defineParameterType(registry, {
      name: "str",
      regexpPattern: /.+/
    });
    const expression = new CucumberExpression(
      "I have {str} cukes in my belly now",
      registry
    );
    const args = expression.match("I have boo cukes in my belly now");
    expect(args).toBeDefined();
    expect(args?.length).toBe(1);
    AssertDefined(args);
    const [arg] = args;
    const value = arg.getValue(arg) as string;
    expect(value).toEqual(expected);
  });
});

// test("argument extension", () => {
//   const registry = new ParameterTypeRegistry();
//   const expression = new CucumberExpression("{string}", registry);
//   const match = expression.match("'foo'")?.[0];
//   const value = match?.getValue(match) as string;
//   console.log(value);
//   console.log(match);
//   console.log(
//     match?.parameterType.transform(match, match?.group.values)
//   );
//   console.log(match?.group.children[0].children);
// });

// test("argument extension", () => {
//   const registry = new ParameterTypeRegistry();
//   const expression = new CucumberExpression("{int}", registry);
//   const match = expression.match("2")?.[0];
//   const value = match?.getValue(match) as string;
//   console.log(value);
//   console.log(match);
//   console.log(
//     match?.parameterType.transform(match.parameterType, match?.group.values)
//   );
//   // console.log(match?.group.children[0].children);
// });

// test("argument extension", () => {
//   const registry = new ParameterTypeRegistry();
//   defineParameterType(registry, BooleanParam)
//   const expression = new CucumberExpression("{boolean}", registry);
//   const match = expression.match("true")?.[0];
//   const value = match?.getValue(match) as string;
//   console.log(value);
//   console.log(match);
//   console.log(
//     match?.parameterType.transform(match, match?.group.values)
//   );
// });
describe("argument extension", () => {
  it("should match a string expression", () => {
    const registry = new ParameterTypeRegistry();
    const expression = new CucumberExpression("{string}", registry);
    const match = expression.match("'foo'")?.[0];
    const value = match?.getValue(match) as string;
    expect(value).toBe("foo");
  });
  it("should match an int expression", () => {
    const registry = new ParameterTypeRegistry();
    const expression = new CucumberExpression("{int}", registry);
    const match = expression.match("2")?.[0];
    const value = match?.getValue(match) as number;
    expect(value).toBe(2);
  });
  it("should match a boolean expression", () => {
    const registry = new ParameterTypeRegistry();
    defineParameterType(registry, BooleanParam);
    const expression = new CucumberExpression("{boolean}", registry);
    const match = expression.match("true")?.[0];
    const value = match?.getValue(match) as boolean;
    expect(value).toBe(true);
  });
  it("should match a date expression", () => {
    const registry = new ParameterTypeRegistry();
    defineParameterType(registry, DateParam);
    const expression = new CucumberExpression("{date}", registry);
    const match = expression.match("2021-09-20")?.[0];
    const value = match?.getValue(match) as Date;
    expect(value).toEqual(new Date("2021-09-20"));
  });
  describe("primitive", () => {
    it("should match a string with a primitive expression", () => {
      const registry = new ParameterTypeRegistry();
      defineParameterType(registry, PrimitiveParam);
      const expression = new CucumberExpression("{primitive}", registry);
      const match = expression.match("'foo'")?.[0];
      const value = match?.getValue(match) as string;
      expect(value).toBe("foo");
    });

    it("should match a number with a primitive expression", () => {
      const registry = new ParameterTypeRegistry();
      defineParameterType(registry, PrimitiveParam);
      const expression = new CucumberExpression("{primitive}", registry);
      const match = expression.match("2")?.[0];
      const value = match?.getValue(match) as number;
      expect(value).toBe(2);
    });

    it("should match a boolean with a primitive expression", () => {
      const registry = new ParameterTypeRegistry();
      defineParameterType(registry, PrimitiveParam);
      const expression = new CucumberExpression("{primitive}", registry);
      const match = expression.match("true")?.[0];
      const value = match?.getValue(match) as boolean;
      expect(value).toBe(true);
    });

    it("should match a date with a primitive expression", () => {
      const registry = new ParameterTypeRegistry();
      defineParameterType(registry, PrimitiveParam);
      const expression = new CucumberExpression("{primitive}", registry);
      const match = expression.match("2021-09-20")?.[0];
      const value = match?.getValue(match) as Date;
      expect(value).toEqual(new Date("2021-09-20"));
    });
  });
});
