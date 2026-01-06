import type { MatcherContext } from "../core/context";
import { shouldFail } from "../core/context";
import { buildFailureMessage } from "../core/messages";

function requireFiniteNumber<T>(
  ctx: MatcherContext<T>,
  matcher: string
): number {
  const value = ctx.value;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    ctx.fail(matcher, {
      message: buildFailureMessage(
        matcher,
        "Expected value to be a finite number",
        { actual: value }
      ),
      actual: value,
      expected: "finite number",
    });
  }
  return value;
}

function requireFiniteExpected(
  ctx: MatcherContext<unknown>,
  matcher: string,
  expected: number,
  name = "expected"
): void {
  if (typeof expected !== "number" || !Number.isFinite(expected)) {
    ctx.fail(matcher, {
      message: buildFailureMessage(
        matcher,
        `Expected ${name} to be a finite number`,
        { actual: expected }
      ),
      actual: expected,
      expected: "finite number",
    });
  }
}

export function assertToBeGreaterThan<T>(
  ctx: MatcherContext<T>,
  expected: number
): number {
  const actual = requireFiniteNumber(ctx, "toBeGreaterThan");
  requireFiniteExpected(ctx as MatcherContext<unknown>, "toBeGreaterThan", expected);

  const pass = actual > expected;
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? `Expected value not to be greater than ${expected}`
      : `Expected value to be greater than ${expected}`;

    ctx.fail("toBeGreaterThan", {
      message: buildFailureMessage("toBeGreaterThan", baseMessage, {
        expected,
        actual,
      }),
      actual,
      expected,
    });
  }

  return actual;
}

export function assertToBeGreaterThanOrEqual<T>(
  ctx: MatcherContext<T>,
  expected: number
): number {
  const actual = requireFiniteNumber(ctx, "toBeGreaterThanOrEqual");
  requireFiniteExpected(
    ctx as MatcherContext<unknown>,
    "toBeGreaterThanOrEqual",
    expected
  );

  const pass = actual >= expected;
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? `Expected value not to be greater than or equal to ${expected}`
      : `Expected value to be greater than or equal to ${expected}`;

    ctx.fail("toBeGreaterThanOrEqual", {
      message: buildFailureMessage("toBeGreaterThanOrEqual", baseMessage, {
        expected,
        actual,
      }),
      actual,
      expected,
    });
  }

  return actual;
}

export function assertToBeLessThan<T>(
  ctx: MatcherContext<T>,
  expected: number
): number {
  const actual = requireFiniteNumber(ctx, "toBeLessThan");
  requireFiniteExpected(ctx as MatcherContext<unknown>, "toBeLessThan", expected);

  const pass = actual < expected;
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? `Expected value not to be less than ${expected}`
      : `Expected value to be less than ${expected}`;

    ctx.fail("toBeLessThan", {
      message: buildFailureMessage("toBeLessThan", baseMessage, {
        expected,
        actual,
      }),
      actual,
      expected,
    });
  }

  return actual;
}

export function assertToBeLessThanOrEqual<T>(
  ctx: MatcherContext<T>,
  expected: number
): number {
  const actual = requireFiniteNumber(ctx, "toBeLessThanOrEqual");
  requireFiniteExpected(
    ctx as MatcherContext<unknown>,
    "toBeLessThanOrEqual",
    expected
  );

  const pass = actual <= expected;
  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? `Expected value not to be less than or equal to ${expected}`
      : `Expected value to be less than or equal to ${expected}`;

    ctx.fail("toBeLessThanOrEqual", {
      message: buildFailureMessage("toBeLessThanOrEqual", baseMessage, {
        expected,
        actual,
      }),
      actual,
      expected,
    });
  }

  return actual;
}

export function assertToBeCloseTo<T>(
  ctx: MatcherContext<T>,
  expected: number,
  precision = 2
): number {
  const actual = requireFiniteNumber(ctx, "toBeCloseTo");
  requireFiniteExpected(ctx as MatcherContext<unknown>, "toBeCloseTo", expected);

  if (!Number.isInteger(precision) || precision < 0 || precision > 20) {
    ctx.fail("toBeCloseTo", {
      message: buildFailureMessage(
        "toBeCloseTo",
        "Expected precision to be an integer between 0 and 20",
        { actual: precision }
      ),
      actual: precision,
      expected: "integer between 0 and 20",
    });
  }

  const tolerance = Math.pow(10, -precision) / 2;
  const difference = Math.abs(actual - expected);
  // Floating-point operations can produce tiny rounding errors near the boundary.
  // We allow an EPSILON-scaled slack so values that are mathematically on the
  // boundary don't fail due to representation quirks.
  const epsilon = Number.EPSILON * Math.max(1, Math.abs(actual), Math.abs(expected)) * 2;
  const pass = difference <= tolerance + epsilon;

  if (shouldFail(pass, ctx.negated)) {
    const baseMessage = ctx.negated
      ? `Expected value not to be close to ${expected} (precision ${precision})`
      : `Expected value to be close to ${expected} (precision ${precision})`;

    ctx.fail("toBeCloseTo", {
      message: buildFailureMessage("toBeCloseTo", baseMessage, {
        expected,
        actual,
        extra: [
          `Difference: ${difference}`,
          `Tolerance: ${tolerance}`,
        ],
      }),
      actual,
      expected,
    });
  }

  return actual;
}
