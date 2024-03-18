import { ArgumentType } from "./arguments/types";
import { Overload } from "./overload";
import { OverloadAction } from "./overload-actions";
import { AnyArg, ReturnTypes } from "./types";

export class Overloads<T extends Overload<AnyArg[], OverloadAction>[]> {
  constructor(readonly overloads: T) {
    // overloads.forEach((argument, idx) => argument.args[0].withIndex(idx));
  }

  match(args: ArgumentType[]) {
    for (const overload of this.overloads) {
      const match = overload.isMatch(args);
      if (match && overload.actionOrError instanceof Function) {
        return overload.actionOrError(...args);
      }
      if (match && overload.actionOrError instanceof Error) {
        throw overload.actionOrError;
      }
    }
    const fallback = this.overloads.find((it) => it.fallback === true);
    if (fallback && fallback.actionOrError instanceof Function) {
      return fallback.actionOrError(...args);
    }
    const reports = this.overloads
      .map((it, idx) => it.getReport(idx, args))
      .join("\n\n");
    throw new Error(`No overloaded function implementation was found for
function(${args.join(", ")}){}
${reports}`);
  }
}

/**
 * Entrypoint for overload implementations. Accepts parameter validators and their matching
 * function implementations. Once complete, pass the function args to `.use(args)` to execute
 * your overloads. If none are matching and no fallback is provided, an error will be thrown.
 *
 * ```ts
 * function foo(a: string, b: number): void;
 * function foo(...args: (string | number)[]){
 *  return overloads(
 *    def(string(), number()).match((a, b)=>{...})
 *    fallback().match((a, b)=>{...})
 *  ).use(args)
 * }
 * ```
 * @param args
 * @returns
 */
export function overloads<T extends Overload<AnyArg[], OverloadAction>[]>(
  ...args: T
) {
  const overloads = new Overloads(args);
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    use: (actualArgs: unknown[]): ReturnTypes<T> => overloads.match(actualArgs),
  };
}
