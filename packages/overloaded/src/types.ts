import { ArgumentType, BaseArgument } from "./arguments/base-argument";
import { Overload } from "./overload";
export type AnyArg = BaseArgument<ArgumentType>;

export type ValidatorArgumentTuple<T> = {
  [K in keyof T]: T[K] extends AnyArg
    ? T[K] extends BaseArgument<infer Q>
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
    ? TAction extends (...args: unknown[]) => infer TReturnType
      ? TReturnType
      : never
    : never;
};

export type ReturnTypes<T> = T extends Overload[]
  ? ReturnTypeTuple<T> extends infer K
    ? K extends unknown[]
      ? K[number]
      : never
    : never
  : never;
