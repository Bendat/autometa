import type { MatcherContext } from "../core/context";
import { buildFailureMessage } from "../core/messages";

const NIL_MESSAGE = "Value is null or undefined";

export function assertToBeDefined<T>(ctx: MatcherContext<T>): NonNullable<T> {
  const isDefined = ctx.value !== null && typeof ctx.value !== "undefined";
  if (ctx.negated ? isDefined : !isDefined) {
    const baseMessage = ctx.negated
      ? "Expected value to be null or undefined"
      : NIL_MESSAGE;
    ctx.fail("toBeDefined", {
      message: buildFailureMessage("toBeDefined", baseMessage, {
        actual: ctx.value,
      }),
      actual: ctx.value,
    });
  }
  return ctx.value as NonNullable<T>;
}

export function assertToBeUndefined<T>(ctx: MatcherContext<T>): undefined {
  const isUndefined = typeof ctx.value === "undefined";
  if (ctx.negated ? isUndefined : !isUndefined) {
    const baseMessage = ctx.negated
      ? "Expected value not to be undefined"
      : "Expected value to be undefined";
    ctx.fail("toBeUndefined", {
      message: buildFailureMessage("toBeUndefined", baseMessage, {
        actual: ctx.value,
      }),
      actual: ctx.value,
    });
  }
  return undefined;
}

export function assertToBeNull<T>(ctx: MatcherContext<T>): null {
  const isNull = ctx.value === null;
  if (ctx.negated ? isNull : !isNull) {
    const baseMessage = ctx.negated
      ? "Expected value not to be null"
      : "Expected value to be null";
    ctx.fail("toBeNull", {
      message: buildFailureMessage("toBeNull", baseMessage, {
        actual: ctx.value,
      }),
      actual: ctx.value,
    });
  }
  return null;
}
