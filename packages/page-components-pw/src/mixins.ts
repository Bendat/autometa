import { Class } from "@autometa/types";
import { Component } from "./component";
import { Constructable } from "./types";

type MixinType<T> = (base: Constructable) => T;

type Mixed<T, TAccumulator = unknown> = T extends [infer THead, ...infer TTail]
  ? THead extends (base: Constructable) => infer TReturn
    ? TReturn extends Constructable
      ? Mixed<TTail, TAccumulator & TReturn>
      : never
    : never
  : TAccumulator & Class<Component>;
  
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Behavior<T extends MixinType<any>[]>(...args: T) {
  return args.reduce(
    (superClass, mixinFactory) => mixinFactory(superClass),
    Component
  ) as unknown as Mixed<T>;
}
