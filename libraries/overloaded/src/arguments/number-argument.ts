import { Infer, string, object, number as num, tuple, literal } from "myzod";
import { BaseArgument } from "./base-argument";

export const NumberValidationSchema = object({
  max: num().optional(),
  min: num().optional(),
  equals: num().optional(),
  type: literal("int").or(literal("float")).optional(),
});
const NumberArgumentConstructorSchema = tuple([
  string(),
  NumberValidationSchema,
])
  .or(tuple([string().or(NumberValidationSchema).optional()]))
  .or(tuple([]));

export type NumberValidatorOpts = Infer<typeof NumberValidationSchema>;

export class NumberArgument<T extends number> extends BaseArgument<T> {
  typeName = "number";
  options?: NumberValidatorOpts | undefined;
  argName?: string | undefined;
  constructor(
    args?:
      | [string | NumberValidatorOpts | undefined]
      | [
          string | NumberValidatorOpts | undefined,
          string | NumberValidatorOpts | undefined
        ]
  ) {
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

  assertNumber(num?: number) {
    if (typeof num !== "number") {
      const message = `Expected value to be a number but was [${typeof num}]: ${num}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertNumberEquals(num: number, equals = this.options?.equals) {
    if (equals !== undefined && num !== equals) {
      const message = `Expected ${num} to equal ${equals} but did not.`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertNumberLessThanMax(num: number, max = this.options?.max) {
    if (max !== undefined && num > max) {
      const message = `Expected number ${num} to be less than max value ${max}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertNumberGreaterThanMin(num: number, min = this.options?.min) {
    if (min !== undefined && num < min) {
      const message = `Expected number to be greater than minimum value ${min}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  validate(value: number): boolean {
    this.assertDefined(value);
    this.assertNumber(value);
    this.assertNumberEquals(value);
    this.assertNumberGreaterThanMin(value);
    this.assertNumberLessThanMax(value);
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
  const [nameOrOpts, opts] = args;
  NumberArgumentConstructorSchema.parse(args);
  return new NumberArgument([nameOrOpts, opts]);
}
