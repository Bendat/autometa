import { AnyArg } from "src/types";
import { BaseArgument } from "./base-argument";

export type Primitive = string | number | boolean | undefined | null;
export type Shape = { [key: string]: ArgumentType };
export type Array = { [key: number]: ArgumentType };
export type Tuple = [ArgumentType, ...ArgumentType[]];

export type ArgumentType = Shape | Array | Tuple | Primitive;

export type CamelCase<T extends string> =
  T extends `${infer _TPrefix} ${infer _TSuffix}`
    ? {
        error: `argument names should not contain spaces. Please update '${T}'`;
      }
    : T;

export type FromTuple<T extends BaseArgument<ArgumentType>[]> = {
  [key in keyof T]: T[key] extends BaseArgument<infer K> ? K : never;
};

export type TupleType = [AnyArg, ...AnyArg[]];

export type ShapeType = { [key: string]: AnyArg };
type ShapeArgType<T> = {
  [K in keyof T]: T[K] extends AnyArg ? T : never;
};

export type FromShape<T> = T extends ShapeArgType<T>
  ? InferArg<T>
  : { error: `Could not convert shape as it did not extend AnyArgType` };

export type InferArg<T> = {
  [K in keyof T]: T[K] extends BaseArgument<infer TArg> ? TArg : never;
};

export type FromFunction<T extends BaseArgument<ArgumentType>[]> = {
  [key in keyof T]: T[key] extends BaseArgument<infer K> ? K : never;
};
export type FunctionType = (
  ...args: AnyArg[]
) => AnyArg | void | Promise<AnyArg | void>;
