import type { MatcherContext } from "../core/context";
import { buildFailureMessage } from "../core/messages";

type EnsureTypeOf =
  | "string"
  | "number"
  | "boolean"
  | "bigint"
  | "symbol"
  | "undefined"
  | "object"
  | "function";

export function assertToBeTypeOf<T>(ctx: MatcherContext<T>, expected: EnsureTypeOf): void {
  const actualType = typeof ctx.value;
  const pass = actualType === expected;

  if (ctx.negated ? pass : !pass) {
    const baseMessage = ctx.negated
      ? `Expected value not to be of type ${expected}`
      : `Expected value to be of type ${expected}`;
    ctx.fail("toBeTypeOf", {
      message: buildFailureMessage("toBeTypeOf", baseMessage, {
        expected,
        actual: ctx.value,
        extra: [`Received type: ${actualType}`],
      }),
      expected,
      actual: ctx.value,
    });
  }
}

