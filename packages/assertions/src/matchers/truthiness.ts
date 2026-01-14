import type { MatcherContext } from "../core/context";
import { buildFailureMessage } from "../core/messages";

export function assertToBeTruthy<T>(ctx: MatcherContext<T>): void {
  const pass = Boolean(ctx.value);
  if (ctx.negated ? pass : !pass) {
    const baseMessage = ctx.negated
      ? "Expected value to be falsy"
      : "Expected value to be truthy";
    ctx.fail("toBeTruthy", {
      message: buildFailureMessage("toBeTruthy", baseMessage, {
        actual: ctx.value,
      }),
      actual: ctx.value,
    });
  }
}

export function assertToBeFalsy<T>(ctx: MatcherContext<T>): void {
  const pass = !ctx.value;
  if (ctx.negated ? pass : !pass) {
    const baseMessage = ctx.negated
      ? "Expected value to be truthy"
      : "Expected value to be falsy";
    ctx.fail("toBeFalsy", {
      message: buildFailureMessage("toBeFalsy", baseMessage, {
        actual: ctx.value,
      }),
      actual: ctx.value,
    });
  }
}
