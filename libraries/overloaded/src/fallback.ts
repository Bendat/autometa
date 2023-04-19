/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseArgument } from "./arguments/base-argument";
import { ArgumentType } from "./arguments/types";
import {
  disposeDescription,
  disposeTaggedTemplate,
} from "./disposeDescription";
import { Overload } from "./overload";
import { AnyArg } from "./types";

export function fallback<P extends ArgumentType[], K>(
  description: string,
  implementation: (...args: P) => K
): Overload<AnyArg[], (...args: P) => K>;
export function fallback<P extends ArgumentType[], K>(
  implementation: (...args: P) => K
): Overload<AnyArg[], (...args: P) => K>;
export function fallback<P extends ArgumentType[], K>(
  ...args: unknown[]
): Overload<AnyArg[], (...args: P) => K> {
  const description = disposeDescription(args);
  const [implementation] = args as [(...args: P) => K];

  return new Overload(
    "fallback",
    description,
    [] as BaseArgument<any>[],
    implementation,
    true
  );
}
