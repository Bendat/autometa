import { ArgumentType } from "./arguments/base-argument";
import { argStringArray } from "./formatting";
import { Overload } from "./overload";
import { ReturnTypeTuple } from "./types";

export class Overloads<T extends Overload[]> {
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
    function(${args}){
    }
${reports}`);
  }
}

export function overloads<T extends Overload[]>(...args: T) {
  const overloads = new Overloads(args);
  return {
    use: (actualArgs: any[]): any => overloads.match(actualArgs),
    // use: (actualArgs: any[]): ReturnTypeTuple<T> => overloads.match(actualArgs),
  };
}
