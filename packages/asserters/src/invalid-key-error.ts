import { AutomationError } from "@autometa/errors";
import { closestMatch } from "closest-match";
import { AnyFunction } from "@autometa/types";

export class InvalidKeyError<
  T extends Record<string, unknown> | AnyFunction
> extends AutomationError {
  bestMatches: string | string[];
  constructor(
    readonly key: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly item: T
  ) {
    const matches = closestMatch(key as string, Object.keys(item), true) ?? [];
    super(
      `Key ${String(key)} does not exist on target ${item}.
  These keys are similar. Did you mean one of these?: 
  ${Array.isArray(matches) ? matches.join("\n") : matches}`
    );
    this.bestMatches = matches;
  }
}
