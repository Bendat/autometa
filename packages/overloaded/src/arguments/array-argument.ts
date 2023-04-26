import { object } from "myzod";
import { params } from "src/params";
import { AnyArg, ArgumentTypes } from "src/types";
import { ArgumentType, BaseArgument } from "./base-argument";
import { number, NumberArgument } from "./number-argument";
import { ShapeArgument } from "./shape-argument";
import { string, StringArgument } from "./string-argument";
export type FromArray<T> = T extends infer TArray
  ? TArray extends BaseArgument<infer TArg>[]
    ? TArg[]
    : never
  : never;
export type ArrayType = AnyArg[];

type f = FromArray<[BaseArgument<string>, BaseArgument<number>]>;
//   ^?
export const ShapeValidationSchema = object({
  //   types: (),
});
type ArrayOptions = {
  length: number;
  maxLength: number;
  minLength: number;
};
export class ArrayArgument<
  T extends ArrayType,
  TRaw extends FromArray<T>
> extends BaseArgument<TRaw> {
  typeName = "object";
  options?: ArrayOptions;
  constructor(readonly reference: T) {
    super();
    for (const key in reference) {
      const name = reference[key].argName;
      if (!name) {
        reference[key].argName = key;
        reference[key].argCategory = "Property";
      }
    }
  }
  assertLengthLessThanMax(value: unknown) {}
  assertLengthGreaterThanZero(value: unknown) {}
  assertLengthEquals(value: unknown) {}
  validate(value: unknown): boolean {
    throw new Error("Method not implemented.");
  }
}

// export interface ArrayConfig<TAllowedTypes extends ArgumentType[]> {}

export function array<P extends AnyArg[], T extends ArgumentTypes<P>>(
  reference: T
) {
  return new ArrayArgument(reference);
}
const str2 = [new StringArgument(), new NumberArgument()];
//    ^?
const str = ["", number(), string()];
//    ^?

const arr = array([string(), number()]);
//    ^?

class Foo<T> {}

const t = [new Foo<string>(), new Foo<number>()];
//    ^?

const p = params(array([string(), number()])).matches((a) => 1);
//    ^?
