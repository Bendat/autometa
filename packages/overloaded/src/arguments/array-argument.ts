import { object, number as num, Infer } from "myzod";
import { AnyArg, ArgumentTypes } from "src/types";
import { BaseArgument } from "./base-argument";
export type FromArray<T> = T extends infer TArray
  ? TArray extends BaseArgument<infer TArg>[]
    ? TArg[]
    : never
  : never;
export type ArrayType = AnyArg[];

export const ArrayValidationSchema = object({
  maxLength: num().optional(),
  minLength: num().optional(),
  length: num().optional(),
});

type ArrayOptions = Infer<typeof ArrayValidationSchema>;

export class ArrayArgument<
  T extends ArrayType,
  TRaw extends FromArray<T>
> extends BaseArgument<TRaw> {
  typeName = "object";
  types: string[] = [];
  constructor(readonly reference: T, readonly options?: ArrayOptions) {
    super();
    for (const value of reference) {
      if (!this.types.includes(value.typeName)) {
        this.types.push(value.typeName);
      }
    }
  }
  assertIsArray(values: unknown): asserts values is T {
    if (!Array.isArray(values)) {
      const message = `Expected value to be an array but found ${typeof values}`;
      this.accumulator.push(this.fmt(message));
    }
  }
  assertLengthLessThanMax(values: unknown[], length = this.options?.maxLength) {
    if (!Array.isArray(values)) {
      return;
    }
    if (length && values?.length <= length) {
      this.accumulator.push(
        `Expected value to be an array with max length ${length} but was ${values?.length}`
      );
    }
  }
  assertLengthGreaterThanMin(
    values: unknown[],
    length = this.options?.maxLength
  ) {
    if (!Array.isArray(values)) {
      return;
    }
    if (length && values?.length >= length) {
      this.accumulator.push(
        `Expected value to be an array with min length ${length} but was ${values?.length}`
      );
    }
  }
  assertLengthEquals(values: unknown[], length = this.options?.length) {
    if (!Array.isArray(values)) {
      return;
    }
    if (length !== values?.length) {
      this.accumulator.push(
        `Expected array to have length ${length} but was ${values?.length}`
      );
    }
  }
  assertPermittedType(values: unknown[]) {
    if (!Array.isArray(values)) {
      return;
    }
    for (const value of values) {
      if (!this.types.includes(typeof value)) {
        throw new Error(
          `Expected array to contain only known types ${
            this.types
          } but found ${typeof value}: ${value}; ${values}`
        );
      }
    }
  }

  assertChildValidations(values: unknown) {
    if (!Array.isArray(values)) {
      return;
    }
    for (const value of values) {
      const validated = this.reference.map((it) => it.validate(value));
      const foundMatch = validated.includes(true);
      if (!foundMatch) {
        const message = `Expected array value to be one of ${
          this.types
        } but found ${typeof value}:`;
        this.accumulator.push(this.fmt(message));
        this.accumulator.push(...this.reference.map((it) => it.accumulator));
      }
    }
  }

  validate(value: unknown): boolean {
    this.assertDefined(value);
    this.assertIsArray(value);
    this.assertLengthEquals(value);
    this.assertLengthGreaterThanMin(value);
    this.assertLengthLessThanMax(value);
    return this.accumulator.length === 0;
  }
}

export function array<P extends AnyArg[], T extends ArgumentTypes<P>>(
  acceptedTypes: T
): ArrayArgument<P, FromArray<T>>;
export function array<P extends AnyArg[], T extends ArgumentTypes<P>>(
  acceptedTypes: T,
  options: ArrayOptions
): ArrayArgument<P, FromArray<T>>;
export function array<P extends AnyArg[], T extends ArgumentTypes<P>>(
  acceptedTypes: T,
  options?: ArrayOptions
) {
  return new ArrayArgument(acceptedTypes, options);
}
