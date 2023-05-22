import {
  Infer,
  string,
  object,
  number as num,
  tuple,
  literal,
  array,
} from "myzod";
import { BaseArgument, BaseArgumentSchema } from "./base-argument";

export const NumberValidationSchema = object({
  max: num().optional(),
  min: num().optional(),
  equals: num().optional(),
  type: literal("int").or(literal("float")).optional(),
  in: array(num()).optional(),
}).and(BaseArgumentSchema);

const NumberArgumentParamsSchema = tuple([string(), NumberValidationSchema])
  .or(tuple([string().or(NumberValidationSchema).optional()]))
  .or(tuple([]));

export type NumberValidatorOpts = Infer<typeof NumberValidationSchema>;

export class NumberArgument<T extends number> extends BaseArgument<T> {
  typeName = "number";
  options?: NumberValidatorOpts | undefined;
  argName?: string | undefined;
  constructor(args: (NumberValidatorOpts | string)[]) {
    super();
    if (!args) {
      return;
    }
    if (typeof args[0] === "string") {
      this.argName = args[0];
    }
    if (typeof args[0] === "object") {
      this.options = args[0];
    }
    if (typeof args[1] === "object") {
      this.options = args[1];
    }
  }
  isTypeMatch(type: unknown): boolean {
    return typeof type === this.typeName;
  }
  assertNumber(num?: unknown) {
    if (typeof num !== "number") {
      const message = `Expected value to be a number but was [${typeof num}]: ${num}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertNumberEquals(num: unknown, equals = this.options?.equals) {
    if (typeof num !== "number" && typeof num !== "bigint") {
      return;
    }
    if (equals !== undefined && num !== equals) {
      const message = `Expected ${num} to equal ${equals} but did not.`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertNumberLessThanMax(num: unknown, max = this.options?.max) {
    if (typeof num !== "number" && typeof num !== "bigint") {
      return;
    }
    if (max !== undefined && num > max) {
      const message = `Expected number ${num} to be less than max value ${max}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertNumberGreaterThanMin(num: unknown, min = this.options?.min) {
    if (typeof num !== "number" && typeof num !== "bigint") {
      return;
    }
    if (min !== undefined && num < min) {
      const message = `Expected number to be greater than minimum value ${min}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertinArray(val: unknown, value?: number) {
    console.log(typeof num !== "number");
    console.log(typeof num !== "bigint");
    if (typeof num !== "number" && typeof num !== "bigint") {
      return;
    }
    if (value && Array.isArray(value) && !value.includes(val)) {
      const message = `Expected ${value} to include ${val} but it was not`;
      this.accumulator.push(this.fmt(message));
      return false;
    }
    return true;
  }
  assertType(value: unknown, type = this.options?.type) {
    if (typeof value !== "number") {
      return;
    }
    if (type === "float" && Number.isInteger(value)) {
      const message = `Expected number '${value}' to be a float but was an integer`;
      this.accumulator.push(this.fmt(message));
    }
    if (type === "int" && !Number.isInteger(value)) {
      const message = `Expected number '${value}' to be an integer but was a float`;
      this.accumulator.push(this.fmt(message));
    }
  }
  validate(value: number): boolean {
    this.assertDefined(value);
    this.assertNumber(value);
    this.assertNumberEquals(value);
    this.assertinArray(value);
    this.assertNumberGreaterThanMin(value);
    this.assertNumberLessThanMax(value);
    this.assertType(value);
    return this.accumulator.length === 0;
  }
}

export function number(): NumberArgument<number>;
export function number(opts: NumberValidatorOpts): NumberArgument<number>;
export function number(name: string): NumberArgument<number>;
export function number(
  name: string,
  opts: NumberValidatorOpts
): NumberArgument<number>;
export function number(
  ...args: (NumberValidatorOpts | string)[]
): NumberArgument<number> {
  NumberArgumentParamsSchema.parse(args);
  return new NumberArgument(args);
}
