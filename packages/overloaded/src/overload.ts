import { ArgumentType, BaseArgument } from "./arguments/base-arguments";
import { argStringArray, colorCompareArgStrings } from "./formatting";

export class Overload<
  TArgs extends BaseArgument[] = BaseArgument[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TAction extends (...args: any[]) => any = (...args: any) => any
> {
  constructor(readonly args: TArgs, readonly action: TAction) {
    args.forEach((arg, idx) => arg.withIndex(idx));
  }

  isMatch(args: ArgumentType[]) {
    if (args === undefined || args === null) {
      args = [];
    }
    for (let i = 0; i < this.args.length; i++) {
      const argWrapper = this.args[i];
      const arg = args[i];
      if (!argWrapper.validate(arg)) {
        return false;
      }
    }
    return true;
  }

  typeStringArray() {
    return this.args.map((it) => it.typeName);
  }

  getReport(index: number, realArgs: unknown[]) {
    const expectedTypeStrings = this.typeStringArray();
    const actualTypeStrings = argStringArray(realArgs);
    const compare = colorCompareArgStrings(
      expectedTypeStrings,
      actualTypeStrings
    );
    return `Overload[${index}] did not match because:
    Expected: ${compare[0].join(", ")}
    Actual  : ${compare[1].join(", ")}

    ${this.args
      .filter((it) => it.accumulator.length > 0)
      .map((it) => it.accumulator.join("\n\n    "))}`;
  }
}
