import { ParameterType, ParameterTypeRegistry } from "@cucumber/cucumber-expressions";

export const CucumberParameters = new ParameterTypeRegistry();
interface Constructor<T> extends Function {
  new (...args: unknown[]): T;
  prototype: T;
}
export function defineParameterType(
  ...params: {
    name: string;
    type?: Constructor<unknown>;
    regexpPattern: RegExp | RegExp[];
    transform: (value: unknown) => unknown;
  }[]
) {
  params.forEach(({ name, regexpPattern, transform, type }) => {
    CucumberParameters.defineParameterType(
      new ParameterType(name, regexpPattern, type ?? String, transform)
    );
  });
}

const FLOAT_REGEXP = /(?=.*\d.*)[-+]?\d*(?:\.(?=\d.*))?\d*(?:\d+[E][+-]?\d+)?/;
defineParameterType(
  {
    name: "bool",
    regexpPattern: /true|false/,
    type: Boolean,
    transform: (value) => {
      if (value === "true") {
        return true;
      }
      if (value === "false") {
        return false;
      }
      throw new Error("Unknown boolean " + value);
    },
  },
  {
    name: "boolean",
    regexpPattern: /true|false/,
    type: Number,
    transform: (value): boolean => {
      if (value === "true") {
        return true;
      }
      if (value === "false") {
        return false;
      }
      throw new Error("Unknown boolean " + value);
    },
  },
  {
    name: "number",
    regexpPattern: FLOAT_REGEXP,
    type: Number,
    transform: (value) => {
      const transformed = Number(value);
      if (isNaN(transformed)) {
        throw new Error(`${value} can not be transformed into a number`);
      }
      return transformed;
    },
  },
  {
    name: "words",
    regexpPattern: /(([aA-zZ]\s?)+)/,
    type: String,
    transform: (value) => {
      return value;
    },
  }
);
