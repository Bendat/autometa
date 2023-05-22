import { Overload } from "./overload";
import { AnyArg, ArgumentTypes, ValidatorArgumentTuple } from "./types";

/**
 * Creates a new set of parameters which should match one overloaded
 * function/method implementation. Returns an object containing a matcher
 * function which will be executed when the arguments match the params list
 *
 * ```ts
 * function foo(a: string, b: number): void;
 * function foo(...args: (string | number)[]){
 *  return overloads(
 *    params(string(), number()).match((a, b)=>{
 *      const modifiedA = doStringThing(a);
 *      const modifiedB = doNumberThing(modifiedA, b);
 *    })
 *  ).use(args)
 * }
 * ```
 * @param args - a rest argument of Arguments, provided by type functions (`string()`, `number()` etc)
 * @returns
 */
export function params<P extends AnyArg[], T extends ArgumentTypes<P>>(...args: T) {
  return {
    /**
     * Implementation for a specific overload. When the arguments passed match this functions
     * parent overload, the arguments will be passed to this functions parameters.
     *
     * The return value will be used in a union in the final return value of the overloading function/method
     * @param implementation
     * @returns
     */
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
