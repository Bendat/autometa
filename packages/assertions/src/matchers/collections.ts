import { equals } from "@jest/expect-utils";

import { EQUALITY_TESTERS, SUBSET_TESTERS } from "../core/constants";
import { type MatcherContext, shouldFail } from "../core/context";
import { buildFailureMessage, formatDiff, formatMissingList } from "../core/messages";
import { hasLengthProperty, isIterable, isRecord } from "../core/predicates";

export function assertObjectContaining<T>(
  ctx: MatcherContext<T>,
  shape: Record<PropertyKey, unknown>
): void {
  const isObject = isRecord(ctx.value);
  if (!isObject) {
    if (!ctx.negated) {
      ctx.fail("toBeObjectContaining", {
        message: buildFailureMessage("toBeObjectContaining", "Expected value to be an object", {
          actual: ctx.value,
        }),
        actual: ctx.value,
      });
    }
    return;
  }

  const pass = equals(ctx.value, shape, SUBSET_TESTERS);
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? "Expected object not to match the provided subset"
      : "Object does not match the provided subset";
    ctx.fail("toBeObjectContaining", {
      message: buildFailureMessage("toBeObjectContaining", baseMessage, {
        expected: shape,
        actual: ctx.value,
        diff: formatDiff(shape, ctx.value),
      }),
      expected: shape,
      actual: ctx.value,
    });
  }
}

export function assertArrayContaining<T>(
  ctx: MatcherContext<T>,
  expected: readonly unknown[]
): readonly unknown[] {
  if (!Array.isArray(ctx.value)) {
    if (!ctx.negated) {
      ctx.fail("toBeArrayContaining", {
        message: buildFailureMessage("toBeArrayContaining", "Expected value to be an array", {
          actual: ctx.value,
        }),
        actual: ctx.value,
      });
    }
    return ctx.value as unknown as readonly unknown[];
  }

  const actual = ctx.value as readonly unknown[];
  const missing = expected.filter((item) =>
    !actual.some((entry: unknown) => equals(entry, item, EQUALITY_TESTERS))
  );

    const pass = missing.length === 0;
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? "Expected array not to contain the provided elements"
      : "Array is missing expected elements";
    ctx.fail("toBeArrayContaining", {
      message: buildFailureMessage("toBeArrayContaining", baseMessage, {
        expected,
        actual,
        extra: [formatMissingList("Missing elements:", missing)],
        diff: formatDiff(expected, actual),
      }),
      expected,
      actual,
    });
  }

    return actual;
}

export function assertContainEqual<T>(
  ctx: MatcherContext<T>,
  expected: unknown
): readonly unknown[] {
  if (!Array.isArray(ctx.value)) {
    if (!ctx.negated) {
      ctx.fail("toContainEqual", {
        message: buildFailureMessage("toContainEqual", "Expected value to be an array", {
          actual: ctx.value,
        }),
        actual: ctx.value,
      });
    }
    return ctx.value as unknown as readonly unknown[];
  }

  const actual = ctx.value as readonly unknown[];
  const pass = actual.some((entry: unknown) => equals(entry, expected, EQUALITY_TESTERS));
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? "Expected array not to contain the provided element"
      : "Array is missing the expected element";
    ctx.fail("toContainEqual", {
      message: buildFailureMessage("toContainEqual", baseMessage, {
        expected,
        actual,
        diff: formatDiff(expected, actual),
      }),
      expected,
      actual,
    });
  }

  return actual;
}

export function assertIterableContaining<T>(
  ctx: MatcherContext<T>,
  expected: readonly unknown[]
): Iterable<unknown> {
  if (!isIterable(ctx.value)) {
    if (!ctx.negated) {
      ctx.fail("toBeIterableContaining", {
        message: buildFailureMessage("toBeIterableContaining", "Expected value to be iterable", {
          actual: ctx.value,
        }),
        actual: ctx.value,
      });
    }
    return ctx.value as unknown as Iterable<unknown>;
  }

  const entries = Array.from(ctx.value as Iterable<unknown>);
  const missing = expected.filter((item) =>
    !entries.some((entry) => equals(entry, item, EQUALITY_TESTERS))
  );

  const pass = missing.length === 0;
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? "Expected iterable not to contain the provided elements"
      : "Iterable is missing expected elements";
    ctx.fail("toBeIterableContaining", {
      message: buildFailureMessage("toBeIterableContaining", baseMessage, {
        expected,
        actual: entries,
        extra: [formatMissingList("Missing elements:", missing)],
      }),
      expected,
      actual: entries,
    });
  }

  return ctx.value as unknown as Iterable<unknown>;
}

export function assertHasLength<T>(ctx: MatcherContext<T>, expected: number): number {
  if (!hasLengthProperty(ctx.value)) {
    if (!ctx.negated) {
      ctx.fail("toHaveLength", {
        message: buildFailureMessage("toHaveLength", "Expected value to have a numeric length property", {
          actual: ctx.value,
        }),
        actual: ctx.value,
      });
    }
    return NaN;
  }

  const actualLength = (ctx.value as { length: number }).length;
  const pass = actualLength === expected;
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? `Expected length to differ from ${expected}`
      : "Length does not match expectation";
    ctx.fail("toHaveLength", {
      message: buildFailureMessage("toHaveLength", baseMessage, {
        expected,
        actual: actualLength,
        diff: formatDiff(expected, actualLength),
      }),
      expected,
      actual: actualLength,
    });
  }

  return actualLength;
}
