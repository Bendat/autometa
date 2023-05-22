import { AnyArg } from "src/types";
import { BaseArgument } from "./base-argument";
import { ShapeArgument } from "./shape-argument";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyType = any;
export type Primitive = string | number | boolean | undefined | null;
export type Ephemeral = unknown;
export type Shape = { [key: string]: ArgumentType };
export type Array = { [key: number]: ArgumentType };
export type Tuple = [ArgumentType, ...ArgumentType[]];

export type ArgumentType = Shape | Array | Tuple | Primitive | Ephemeral;

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
export type InstanceType<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K];
};

export type FromShape<T> = T extends ShapeType
  ? {
      [K in keyof T]: T[K] extends BaseArgument<infer TArg>
        ? TArg
        : T[K] extends ShapeArgument<infer _, infer TShape>
        ? TShape
        : never;
    }
  : never;

export type InferArg<T> = {
  [K in keyof T]: T[K] extends BaseArgument<infer TArg>
    ? TArg
    : T[K] extends ShapeArgument<infer _, infer TShape>
    ? TShape
    : never;
};

export type FromFunction<T extends BaseArgument<ArgumentType>[]> = {
  [key in keyof T]: T[key] extends BaseArgument<infer K> ? K : never;
};
export type FunctionType = (
  ...args: AnyType[]
) => AnyType | void | Promise<AnyType | void>;
