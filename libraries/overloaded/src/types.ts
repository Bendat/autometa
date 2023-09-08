import { BaseArgument } from "./arguments/base-argument";
import { ShapeArgument } from "./arguments/shape-argument";
import { ArgumentType } from "./arguments/types";
import { Overload } from "./overload";
import { OverloadAction } from "./overload-actions";
export type AnyArg = BaseArgument<ArgumentType>;

export type ValidatorArgumentTuple<T> = {
  [K in keyof T]: T[K] extends AnyArg
    ? T[K] extends ShapeArgument<infer _, infer TShape>
      ? TShape
      : T[K] extends BaseArgument<infer Q>
      ? Q
      : never
    : never;
};

export type ArgumentTypes<T> = {
  [K in keyof T]: T[K] extends AnyArg
    ? T[K] extends infer U
      ? U
      : never
    : never;
};

export type ReturnTypeTuple<T> = {
  [K in keyof T]: T[K] extends Overload<infer _TArgs, infer TAction>
    ? ReturnType<TAction> extends [infer THead, ...infer TTail]
      ? [THead, ...TTail]
      : ReturnType<TAction>
    : never;
};

export type ReturnTypes<T> = T extends Overload<AnyArg[], OverloadAction>[]
  ? ReturnTypeTuple<T> extends infer K
    ? K extends unknown[]
      ? K[number]
      : never
    : never
  : never;
