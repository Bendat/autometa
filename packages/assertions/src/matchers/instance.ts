import type { MatcherContext } from "../core/context";
import { buildFailureMessage } from "../core/messages";

export function assertToBeInstanceOf<
  T,
  Ctor extends abstract new (...args: never[]) => unknown
>(ctx: MatcherContext<T>, ctor: Ctor): InstanceType<Ctor> {
  if (typeof ctor !== "function") {
    ctx.fail("toBeInstanceOf", {
      message: buildFailureMessage("toBeInstanceOf", "Constructor must be a callable function", {
        expected: ctor,
      }),
      expected: ctor,
    });
  }

  const pass = ctx.value instanceof ctor;
  if (ctx.negated ? pass : !pass) {
    const label = ctor.name || "<anonymous>";
    const baseMessage = ctx.negated
      ? `Expected value not to be an instance of ${label}`
      : `Expected value to be an instance of ${label}`;
    ctx.fail("toBeInstanceOf", {
      message: buildFailureMessage("toBeInstanceOf", baseMessage, {
        expected: ctor,
        actual: ctx.value,
      }),
      expected: ctor,
      actual: ctx.value,
    });
  }

  return ctx.value as InstanceType<Ctor>;
}
