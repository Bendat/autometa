import { ArgumentType } from "./arguments/types";
import { Overload } from "./overload";
import { OverloadAction } from "./overload-actions";
import { AnyArg, ReturnTypes, ReturnTypeTuple } from "./types";

export class Overloads<T extends Overload<AnyArg[], OverloadAction>[]> {
  constructor(readonly overloads: T) {
    overloads.forEach((argument, idx) => argument.args[0].withIndex(idx));
  }

  match(args: ArgumentType[]) {
    for (const overload of this.overloads) {
      if (overload.isMatch(args)) {
        return overload.action(args);
      }
    }
    const reports = this.overloads
      .map((it, idx) => it.getReport(idx, args))
      .join("\n\n");
    throw new Error(`No overloaded function implementation was found for
function(${args.join(", ")}){}
${reports}`);
  }
}

export function overloads<T extends Overload<AnyArg[], OverloadAction>[]>(
  ...args: T
) {
  const overloads = new Overloads(args);
  return {
    // use: (actualArgs: any[]): any => overloads.match(actualArgs),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    use: (actualArgs: any[]): ReturnTypes<T> => overloads.match(actualArgs),
  };
}
