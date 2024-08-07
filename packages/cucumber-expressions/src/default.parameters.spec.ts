import {
  Argument,
  CucumberExpression,
  ParameterType,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { describe, it, expect, vi } from "vitest";
import {
  BooleanParam,
  NumberParam,
  PrimitiveParam,
} from "./default.parameters";
import { AssertDefined, fib } from "@autometa/asserters";
vi.setSystemTime("2021-01-01T00:00:00.000Z");
Argument.prototype.getValue = function (thisObj: unknown) {
  const groupValues = this.group
    ? this.group.value
      ? [this.group.value]
      : this.group.values
    : null;
  return this.parameterType.transform(thisObj, groupValues);
};
describe("Default Parameters", () => {
  describe("Number Parameter", () => {
    it("should match a number", () => {
      const registry = new ParameterTypeRegistry();
      const { name, regex, primitive } = NumberParam;
      AssertDefined(primitive);
      const transform = (s: string) => Number(s);
      const param = new ParameterType(name, regex, null, transform);
      registry.defineParameterType(param);
      const expression = new CucumberExpression(
        "I have {number} cukes in my belly now",
        registry
      );
      const args = expression.match("I have 7 cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      expect(args?.[0].getValue(null)).toBe(7);
    });
  });

  describe("Boolean Parameter", () => {
    it("should match a boolean", () => {
      const registry = new ParameterTypeRegistry();
      const { name, regex, primitive } = BooleanParam;
      AssertDefined(primitive);
      const transform = (s: string) => Boolean(s);
      const param = new ParameterType(name, regex, null, transform);
      registry.defineParameterType(param);
      const expression = new CucumberExpression(
        "I have {boolean} cukes in my belly now",
        registry
      );
      const args = expression.match("I have true cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      expect(args?.[0].getValue(null)).toBe(true);
    });
  });
  describe("primitives", () => {
    it("should match a boolean primitive", () => {
      const registry = new ParameterTypeRegistry();
      const { name, regex, transform } = PrimitiveParam;
      const param = new ParameterType(name, regex, null, fib(transform));
      registry.defineParameterType(param);
      const expression = new CucumberExpression(
        "I have {primitive} cukes in my belly now",
        registry
      );
      const args = expression.match("I have true cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      expect(args?.[0].getValue(null)).toBe(true);
    });

    describe("number primitive", () => {
      it("should match a positive number primitive", () => {
        const registry = new ParameterTypeRegistry();
        const { name, regex, transform } = PrimitiveParam;
        const param = new ParameterType(name, regex, null, fib(transform));
        registry.defineParameterType(param);
        const expression = new CucumberExpression(
          "I have {primitive} cukes in my belly now",
          registry
        );
        const args = expression.match("I have 7 cukes in my belly now");
        AssertDefined(args);
        const [arg] = args;
        expect(args).toBeDefined();
        expect(args?.length).toBe(1);
        const value = arg.getValue(arg);
        expect(value).toBe(7);
      });
      it("should not match a string", () => {
        const registry = new ParameterTypeRegistry();
        const { name, regex, transform } = PrimitiveParam;
        const param = new ParameterType(name, regex, null, fib(transform));
        registry.defineParameterType(param);
        const expression = new CucumberExpression(
          "I have {primitive} cukes in my belly now",
          registry
        );
        const args = expression.match("I have abc7 cukes in my belly now");
        expect(args).toBeNull();
      });
      it("should match a positive integer primitive with a comma delimiter", () => {
        const registry = new ParameterTypeRegistry();
        const { name, regex, transform } = PrimitiveParam;
        const param = new ParameterType(name, regex, null, fib(transform));
        registry.defineParameterType(param);
        const expression = new CucumberExpression(
          "I have {primitive} cukes in my belly now",
          registry
        );
        const args = expression.match("I have 7,000 cukes in my belly now");
        AssertDefined(args);
        const [arg] = args;
        expect(args).toBeDefined();
        expect(args?.length).toBe(1);
        const value = arg.getValue(arg);
        expect(value).toBe(7000);
      });

      it("should match a negative integer primitive", () => {
        const registry = new ParameterTypeRegistry();
        const { name, regex, transform } = PrimitiveParam;
        const param = new ParameterType(name, regex, null, fib(transform));
        registry.defineParameterType(param);
        const expression = new CucumberExpression(
          "I have {primitive} cukes in my belly now",
          registry
        );
        const args = expression.match("I have -7 cukes in my belly now");
        AssertDefined(args);
        const [arg] = args;
        expect(args).toBeDefined();
        expect(args?.length).toBe(1);
        const value = arg.getValue(arg);
        expect(value).toBe(-7);
      });

      it("should match a negative integer primitive with a comma delimiter", () => {
        const registry = new ParameterTypeRegistry();
        const { name, regex, transform } = PrimitiveParam;
        const param = new ParameterType(name, regex, null, fib(transform));
        registry.defineParameterType(param);
        const expression = new CucumberExpression(
          "I have {primitive} cukes in my belly now",
          registry
        );
        const args = expression.match("I have -7,000 cukes in my belly now");
        AssertDefined(args);
        const [arg] = args;
        expect(args).toBeDefined();
        expect(args?.length).toBe(1);
        const value = arg.getValue(arg);
        expect(value).toBe(-7000);
      });

      it("should match a positive float primitive", () => {
        const registry = new ParameterTypeRegistry();
        const { name, regex, transform } = PrimitiveParam;
        const param = new ParameterType(name, regex, null, fib(transform));
        registry.defineParameterType(param);
        const expression = new CucumberExpression(
          "I have {primitive} cukes in my belly now",
          registry
        );
        const args = expression.match("I have 7.5 cukes in my belly now");
        AssertDefined(args);
        const [arg] = args;
        expect(args).toBeDefined();
        expect(args?.length).toBe(1);
        const value = arg.getValue(arg);
        expect(value).toBe(7.5);
      });

      it("should match a negative float primitive", () => {
        const registry = new ParameterTypeRegistry();
        const { name, regex, transform } = PrimitiveParam;
        const param = new ParameterType(name, regex, null, fib(transform));
        registry.defineParameterType(param);
        const expression = new CucumberExpression(
          "I have {primitive} cukes in my belly now",
          registry
        );
        const args = expression.match("I have -7.5 cukes in my belly now");
        AssertDefined(args);
        const [arg] = args;
        expect(args).toBeDefined();
        expect(args?.length).toBe(1);
        const value = arg.getValue(arg);
        expect(value).toBe(-7.5);
      });

      it("should match a positive float primitive with a comma delimiter", () => {
        const registry = new ParameterTypeRegistry();
        const { name, regex, transform } = PrimitiveParam;
        const param = new ParameterType(name, regex, null, fib(transform));
        registry.defineParameterType(param);
        const expression = new CucumberExpression(
          "I have {primitive} cukes in my belly now",
          registry
        );
        const args = expression.match("I have 7,000.5 cukes in my belly now");
        AssertDefined(args);
        const [arg] = args;
        expect(args).toBeDefined();
        expect(args?.length).toBe(1);
        const value = arg.getValue(arg);
        expect(value).toBe(7000.5);
      });

      it("should match a negative float primitive with a comma delimiter", () => {
        const registry = new ParameterTypeRegistry();
        const { name, regex, transform } = PrimitiveParam;
        const param = new ParameterType(name, regex, null, fib(transform));
        registry.defineParameterType(param);
        const expression = new CucumberExpression(
          "I have {primitive} cukes in my belly now",
          registry
        );
        const args = expression.match("I have -7,000.5 cukes in my belly now");
        AssertDefined(args);
        const [arg] = args;
        expect(args).toBeDefined();
        expect(args?.length).toBe(1);
        const value = arg.getValue(arg);
        expect(value).toBe(-7000.5);
      });

      it("should match a positive float primitive with a comma delimiter and no decimal", () => {
        const registry = new ParameterTypeRegistry();
        const { name, regex, transform } = PrimitiveParam;
        const param = new ParameterType(name, regex, null, fib(transform));
        registry.defineParameterType(param);
        const expression = new CucumberExpression(
          "I have {primitive} cukes in my belly now",
          registry
        );
        const args = expression.match("I have 7,000 cukes in my belly now");
        AssertDefined(args);
        const [arg] = args;
        expect(args).toBeDefined();
        expect(args?.length).toBe(1);
        const value = arg.getValue(arg);
        expect(value).toBe(7000);
      });

      //   it('should match a positive float with a dot delimiter and comma decimal', ()=>{
      //     const registry = new ParameterTypeRegistry();
      //     const { name, regex, transform } = PrimitiveParam;
      //     const param = new ParameterType(name, regex, null, transform);
      //     registry.defineParameterType(param);
      //     const expression = new CucumberExpression('I have {primitive} cukes in my belly now', registry);
      //     const args = expression.match('I have 7.000,5 cukes in my belly now');
      //     AssertDefined(args);
      //     const [arg] = args;
      //     expect(args).toBeDefined();
      //     expect(args?.length).toBe(1);
      //     const value = arg.getValue(arg);
      //     expect(value).toBe(7000.5);
      //   })
    });

    it("should match a null primitive", () => {
      const registry = new ParameterTypeRegistry();
      const { name, regex, transform } = PrimitiveParam;
      const param = new ParameterType(name, regex, null, fib(transform));
      registry.defineParameterType(param);
      const expression = new CucumberExpression(
        "I have {primitive} cukes in my belly now",
        registry
      );
      const args = expression.match("I have null cukes in my belly now");
      expect(args).toBeDefined();
      AssertDefined(args);
      const [arg] = args;
      expect(args?.length).toBe(1);
      expect(arg.getValue(null)).toBe(null);
    });
    it("should be an undefined primitive", () => {
      const registry = new ParameterTypeRegistry();
      const { name, regex, transform } = PrimitiveParam;
      const param = new ParameterType(name, regex, null, fib(transform));
      registry.defineParameterType(param);
      const expression = new CucumberExpression(
        "I have {primitive} cukes in my belly now",
        registry
      );
      const args = expression.match("I have undefined cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      expect(args?.length).toBe(1);
      expect(arg.getValue(null)).toBe(undefined);
    });
    it("should match a string primitive", () => {
      const registry = new ParameterTypeRegistry();
      const { name, regex, transform } = PrimitiveParam;
      const param = new ParameterType(name, regex, null, fib(transform));
      registry.defineParameterType(param);
      const expression = new CucumberExpression(
        "I have {primitive} cukes in my belly now",
        registry
      );
      const args = expression.match('I have "7" cukes in my belly now');
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      const val = arg.getValue(null);
      expect(val).toBe("7");
    });
    it("should match a date phrase primitive", () => {
      const registry = new ParameterTypeRegistry();
      const { name, regex, transform } = PrimitiveParam;
      const param = new ParameterType(name, regex, null, fib(transform));
      registry.defineParameterType(param);
      const expression = new CucumberExpression(
        "I have {primitive} cukes in my belly now",
        registry
      );
      const args = expression.match("I have 'today' cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      const val = arg.getValue(null);
      expect(val).toStrictEqual(new Date("2021-01-01T00:00:00.000Z"));
    });
    it("should match a date primitive", () => {
      const registry = new ParameterTypeRegistry();
      const { name, regex, transform } = PrimitiveParam;
      const param = new ParameterType(name, regex, null, fib(transform));
      registry.defineParameterType(param);
      const expression = new CucumberExpression(
        "I have {primitive} cukes in my belly now",
        registry
      );
      const args = expression.match("I have 2021-01-01 cukes in my belly now");
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      const val = arg.getValue(null);
      expect(val).toStrictEqual(new Date("2021-01-01T00:00:00.000Z"));
    });
    it("should match a datetime primitive", () => {
      const registry = new ParameterTypeRegistry();
      const { name, regex, transform } = PrimitiveParam;
      const param = new ParameterType(name, regex, null, fib(transform));
      registry.defineParameterType(param);
      const expression = new CucumberExpression(
        "I have {primitive} cukes in my belly now",
        registry
      );
      const args = expression.match(
        "I have 2021-01-01T00:00:00.000Z cukes in my belly now"
      );
      expect(args).toBeDefined();
      expect(args?.length).toBe(1);
      AssertDefined(args);
      const [arg] = args;
      const val = arg.getValue(null);
      expect(val).toStrictEqual(new Date("2021-01-01T00:00:00.000Z"));
    });
  });
});
