import { equals } from "@jest/expect-utils";

import { EQUALITY_TESTERS } from "../core/constants";
import { type MatcherContext } from "../core/context";
import { buildFailureMessage, formatDiff } from "../core/messages";

export function assertToBe<T>(ctx: MatcherContext<T>, expected: T): void {
  const pass = Object.is(ctx.value, expected);
  if (ctx.negated ? pass : !pass) {
    const baseMessage = ctx.negated
      ? "Expected values not to be strictly equal"
      : "Expected values to be strictly equal";
    ctx.fail("toBe", {
      message: buildFailureMessage("toBe", baseMessage, {
        actual: ctx.value,
        expected,
        diff: formatDiff(expected, ctx.value),
      }),
      actual: ctx.value,
      expected,
    });
  }
}

export function assertToEqual<T>(ctx: MatcherContext<T>, expected: unknown): void {
  const pass = equals(ctx.value, expected, EQUALITY_TESTERS);
  if (ctx.negated ? pass : !pass) {
    const baseMessage = ctx.negated
      ? "Expected values not to be deeply equal"
      : "Expected values to be deeply equal";
    ctx.fail("toEqual", {
      message: buildFailureMessage("toEqual", baseMessage, {
        actual: ctx.value,
        expected,
        diff: formatDiff(expected, ctx.value),
      }),
      actual: ctx.value,
      expected,
    });
  }
}

export function assertToStrictEqual<T>(ctx: MatcherContext<T>, expected: unknown): void {
  const pass = equals(ctx.value, expected, EQUALITY_TESTERS, true);
  if (ctx.negated ? pass : !pass) {
    const baseMessage = ctx.negated
      ? "Expected values not to be strictly equal (including prototypes and property definitions)"
      : "Expected values to be strictly equal (including prototypes and property definitions)";
    ctx.fail("toStrictEqual", {
      message: buildFailureMessage("toStrictEqual", baseMessage, {
        actual: ctx.value,
        expected,
        diff: formatDiff(expected, ctx.value),
      }),
      actual: ctx.value,
      expected,
    });
  }
}
