import { object, number as num, string as str, Infer } from "myzod";
import { BaseArgument, BaseArgumentSchema } from "./base-argument";
import { FunctionType } from "./types";

export const FunctionValidationSchema = object({
  maxArgLength: num().optional(),
  minArgLength: num().optional(),
  argLength: num().optional(),
  name: str().optional(),
}).and(BaseArgumentSchema);

export type FunctionValidatorOptions = Infer<typeof FunctionValidationSchema>;

export class FunctionArgument<T extends FunctionType> extends BaseArgument<T> {
  typeName = "function";
  types: string[] = [];
  readonly name?: string;
  declare readonly options?: FunctionValidatorOptions;
  constructor(args: (string | FunctionValidatorOptions | undefined)[]) {
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

  isTypeMatch(type: unknown): boolean {
    return type === this.typeName || typeof type === this.typeName;
  }

  assertIsFunction(value: unknown): asserts value is T {
    if (value === undefined) {
      return;
    }
    if (typeof value !== "function") {
      const message = `Expected function arguments to be a function but found ${typeof value}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertLengthLessThanMax(value: unknown, length = this.options?.maxArgLength) {
    if (value === undefined) {
      return;
    }
    if (typeof value !== "function") {
      return;
    }
    if (length && value?.length <= length) {
      const message = `Expected function arguments to be an array with max length ${length} but was ${value?.length}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertLengthGreaterThanMin(
    value: unknown,
    length = this.options?.maxArgLength
  ) {
    if (value === undefined) {
      return;
    }
    if (typeof value !== "function") {
      return;
    }
    if (length && value?.length >= length) {
      const message = `Expected function arguments to be an array with min length ${length} but was ${value?.length}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertLengthEquals(value: unknown, length = this.options?.argLength) {
    if (value === undefined) {
      return;
    }
    if (typeof value !== "function") {
      return;
    }
    if (length !== undefined && length !== value?.length) {
      const message = `Expected function arguments to have length ${length} but was ${value?.length}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertName(value: unknown, name = this.options?.name) {
    if (value === undefined) {
      return;
    }
    if (value === undefined) {
      return;
    }
    if (typeof value !== "function") {
      return;
    }
    if (name && value.name === name) {
      const message = `Expected function to have name ${name} but was ${value?.name}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  validate(value: unknown): boolean {
    this.baseAssertions(value);
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
  options?: FunctionValidatorOptions
): FunctionArgument<T>;
export function func<T extends FunctionType>(
  options: FunctionValidatorOptions
): FunctionArgument<T>;
export function func<T extends FunctionType>(
  ...args: (string | FunctionValidatorOptions | undefined)[]
) {
  return new FunctionArgument<T>(args);
}
