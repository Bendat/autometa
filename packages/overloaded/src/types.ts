import { BaseArgument } from "./arguments/base-arguments";
import { Overload } from "./overload";

export type ValidatorArgumentTuple<T extends unknown[]> = {
  [K in keyof T]: T[K] extends BaseArgument<infer U> ? U : never;
};

export type ArgumentTypes<T> = {
  [K in keyof T]: T[K] extends BaseArgument<infer U> ? BaseArgument<U> : never;
};

export type ReturnTypeTuple<T> = {
  [K in keyof T]: T[K] extends Overload<infer _TArgs, infer TAction>
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      TAction extends (...args: unknown[]) => infer TReturnType
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
