import { object, Infer, array, string, unknown } from "myzod";
import { ArgumentTypes } from "src/types";
import { BaseArgument, BaseArgumentSchema } from "./base-argument";
import { FromTuple, TupleType } from "./types";

export const TupleValidationSchema = object({
  includes: unknown().optional(),
}).and(BaseArgumentSchema);

export type TupleValidatorOpts = Infer<typeof TupleValidationSchema>;
const TupleArgumentParamSchema = array(
  string().or(array(unknown())).or(TupleValidationSchema)
);
export class TupleArgument<
  T extends TupleType,
  TRaw extends FromTuple<T>
> extends BaseArgument<TRaw> {
  declare options?: TupleValidatorOpts;
  typeName = "object";
  types: string[] = [];
  readonly reference: T;
  constructor(args: (string | T | TupleValidatorOpts)[]) {
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
  isTypeMatch(type: unknown): boolean {
    return Array.isArray(type);
  }
  assertIsTuple(values: unknown): asserts values is T {
    if (values === undefined) {
      return;
    }
    if (!Array.isArray(values)) {
      const message = `Expected value to be an array but found ${typeof values}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertIncludes(values: unknown, item = this.options?.includes) {
    if (values === undefined) {
      return;
    }
    if (item && Array.isArray(values)) {
      if (!values.includes(item)) {
        const message = `Expected array to have length ${length} but was ${values?.length}`;
        this.accumulator.push(this.fmt(message));
      }
    }
  }
  assertLength(values: unknown[], length = this.types.length) {
    if (values === undefined) {
      return;
    }
    if (length && values?.length <= length) {
      this.accumulator.push(
        `Expected value to be an array with max length ${length} but was ${values?.length}`
      );
    }
  }
  assertPermittedType(values: unknown) {
    if (values === undefined) {
      return;
    }
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
    this.baseAssertions(value);
    this.assertIsTuple(value);
    this.assertPermittedType(value);
    this.assertIncludes(value);
    return this.accumulator.length === 0;
  }
}

export function tuple<P extends TupleType, T extends ArgumentTypes<P>>(
  name: string,
  acceptedTypes: T,
  options?: TupleValidatorOpts
): TupleArgument<T, FromTuple<T>>;
export function tuple<P extends TupleType, T extends ArgumentTypes<P>>(
  acceptedTypes: T,
  options?: TupleValidatorOpts
): TupleArgument<T, FromTuple<T>>;
export function tuple<P extends TupleType, T extends ArgumentTypes<P>>(
  ...args: (string | T | TupleValidatorOpts)[]
) {
  TupleArgumentParamSchema.parse(args);
  return new TupleArgument(args);
}
