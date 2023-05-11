import { object, number as num, string as str, Infer } from "myzod";
import { BaseArgument, BaseArgumentSchema } from "./base-argument";
import { FunctionType } from "./types";

export const FunctionValidationSchema = object({
  maxArgLength: num().optional(),
  minArgLength: num().optional(),
  argLength: num().optional(),
  name: str().optional(),
}).and(BaseArgumentSchema);

type FunctionOptions = Infer<typeof FunctionValidationSchema>;

export class FunctionArgument<T extends FunctionType> extends BaseArgument<T> {
  typeName = "function";
  types: string[] = [];
  readonly name?: string;
  readonly options?: FunctionOptions;
  constructor(args: (string | FunctionOptions | undefined)[]) {
    super();
    if (typeof args[0] === "string") {
      this.name = args[0];
    }
    if (typeof args[0] === "object") {
      this.options = args[0];
    }
    if (typeof args[1] === "object") {
      this.options = args[1];
    }
  }
  assertIsFunction(value: unknown): asserts value is T {
    if (typeof value !== "function") {
      const message = `Expected function arguments to be a function but found ${typeof value}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertLengthLessThanMax(value: unknown, length = this.options?.maxArgLength) {
    if (typeof value !== "function") {
      return;
    }
    if (length && value?.length <= length) {
      const message = `Expected function arguments to be an array with max length ${length} but was ${value?.length}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertLengthGreaterThanMin(
    values: unknown,
    length = this.options?.maxArgLength
  ) {
    if (typeof values !== "function") {
      return;
    }
    if (length && values?.length >= length) {
      const message = `Expected function arguments to be an array with min length ${length} but was ${values?.length}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertLengthEquals(values: unknown, length = this.options?.argLength) {
    if (typeof values !== "function") {
      return;
    }
    if (length !== values?.length) {
      const message = `Expected function arguments to have length ${length} but was ${values?.length}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertName(func: unknown, name = this.options?.name) {
    if (typeof func !== "function") {
      return;
    }
    if (name && func.name === name) {
      const message = `Expected function to have name ${name} but was ${func?.name}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  validate(value: unknown): boolean {
    this.assertDefined(value);
    this.assertIsFunction(value);
    this.assertLengthEquals(value);
    this.assertLengthGreaterThanMin(value);
    this.assertLengthLessThanMax(value);
    return this.accumulator.length === 0;
  }
}

export function func<T extends FunctionType>(): FunctionArgument<T>;
export function func<T extends FunctionType>(name: string): FunctionArgument<T>;
export function func<T extends FunctionType>(
  name: string,
  options?: FunctionOptions
): FunctionArgument<T>;
export function func<T extends FunctionType>(
  options: FunctionOptions
): FunctionArgument<T>;
export function func<T extends FunctionType>(
  ...args: (string | FunctionOptions | undefined)[]
) {
  return new FunctionArgument<T>(args);
}
