import { Overload } from "./overload";
import { AnyArg, ArgumentTypes, ValidatorArgumentTuple } from "./types";

export function params<P extends AnyArg[], T extends ArgumentTypes<P>>(
  ...args: T
) {
  //   ^?
  return {
    matches: <K>(
      // Typescript doesn't seem to like that this is a tuple type.
      // Otherwise it works fine
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      implementation: (...implArgs: ValidatorArgumentTuple<T>) => K
    ) => {
      return new Overload(args, implementation);
    },
  };
}
