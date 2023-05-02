import { object, number as num } from "myzod";
import { ArgumentTypes } from "src/types";
import { BaseArgument } from "./base-argument";
import { FromTuple, TupleType } from "./types";

export const TupleValidationSchema = object({
  maxLength: num().optional(),
  minLength: num().optional(),
  length: num().optional(),
});

export class TupleArgument<
  T extends TupleType,
  TRaw extends FromTuple<T>
> extends BaseArgument<TRaw> {
  options?: unknown;
  typeName = "object";
  types: string[] = [];
  readonly reference: T;
  constructor(args: (string | T)[]) {
    super();
    if (!args) {
      throw new Error(
        `A TupleArgument requires a reference array of BaseArguments to construct. Provided args: ${args}`
      );
    }
    if (typeof args[0] === "string") {
      this.argName = args[0];
    }
    if (Array.isArray(args[0])) {
      this.reference = args[0];
    }
    if (Array.isArray(args[1])) {
      this.reference = args[1];
    }
    if (!this.reference) {
      throw new Error(
        `A TupleArgument requires a reference array of BaseArguments to construct. Provided args: ${args}`
      );
    }
    this.reference.forEach((it, idx) => {
      this.types.push(it.typeName);
      it.withIndex(idx).argCategory = "Element";
    });
  }
  assertIsTuple(values: unknown): asserts values is T {
    if (!Array.isArray(values)) {
      const message = `Expected value to be an array but found ${typeof values}`;
      this.accumulator.push(this.fmt(message));
    }
  }

  assertLength(values: unknown[], length = this.types.length) {
    if (length && values?.length <= length) {
      this.accumulator.push(
        `Expected value to be an array with max length ${length} but was ${values?.length}`
      );
    }
  }
  assertPermittedType(values: unknown) {
    if (!Array.isArray(values)) {
      return;
    }
    const errors = [];
    for (let i = 0; i < this.types.length; i++) {
      const reference = this.reference[i];
      const actual = values[i];
      if (!reference.validate(actual)) {
        errors.push(reference);
      }
    }
    if (errors.length > 0) {
      const message = `Expected all tuple values to be valid but found:`;
      this.accumulator.push(this.fmt(message));
      errors.forEach((it) => this.accumulator.push(it.accumulator));
    }
  }

  validate(value: unknown): boolean {
    this.assertDefined(value);
    this.assertIsTuple(value);
    this.assertPermittedType(value);
    return this.accumulator.length === 0;
  }
}

export function tuple<P extends TupleType, T extends ArgumentTypes<P>>(
  name: string,
  acceptedTypes: T
): TupleArgument<T, FromTuple<T>>;
export function tuple<P extends TupleType, T extends ArgumentTypes<P>>(
  acceptedTypes: T
): TupleArgument<T, FromTuple<T>>;
export function tuple<P extends TupleType, T extends ArgumentTypes<P>>(
  ...args: (string | T)[]
) {
  return new TupleArgument(args);
}
