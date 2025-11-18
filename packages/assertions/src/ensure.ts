import { equals, iterableEquality, subsetEquality, type Tester } from "@jest/expect-utils";
import { diff } from "jest-diff";
import { printExpected, printReceived } from "jest-matcher-utils";
import { EnsureError, type EnsureErrorDetails } from "./assertion-error";

const NIL_MESSAGE = "Value is null or undefined";
const MATCHER_CALL = "ensure(received)";
const EQUALITY_TESTERS: Tester[] = [iterableEquality];
const SUBSET_TESTERS: Tester[] = [iterableEquality, subsetEquality];

export interface EnsureOptions {
  readonly label?: string;
}

export interface EnsureChain<T> {
  readonly value: T;
  toBe(expected: T): EnsureChain<T>;
  toEqual(expected: unknown): EnsureChain<T>;
  toStrictEqual(expected: unknown): EnsureChain<T>;
  toBeDefined(): EnsureChain<NonNullable<T>>;
  toBeUndefined(): EnsureChain<undefined>;
  toBeNull(): EnsureChain<null>;
  toBeTruthy(): EnsureChain<T>;
  toBeFalsy(): EnsureChain<T>;
  toBeInstanceOf<Ctor extends abstract new (...args: never[]) => unknown>(
    ctor: Ctor
  ): EnsureChain<InstanceType<Ctor>>;
  toBeObjectContaining<Shape extends Record<PropertyKey, unknown>>(
    shape: Shape
  ): EnsureChain<T>;
  toBeArrayContaining(expected: readonly unknown[]): EnsureChain<T & readonly unknown[]>;
  toContainEqual(expected: unknown): EnsureChain<T & readonly unknown[]>;
  toBeIterableContaining(expected: readonly unknown[]): EnsureChain<T & Iterable<unknown>>;
  toHaveLength(expected: number): EnsureChain<T & { length: number }>;
}

interface AssertionContext<T> {
  readonly value: T;
  readonly label?: string;
}

export function ensure<T>(value: T, options: EnsureOptions = {}): EnsureChain<T> {
  const context = options.label
    ? ({ value, label: options.label } satisfies AssertionContext<T>)
    : ({ value } satisfies AssertionContext<T>);
  return new EnsureChainImpl<T>(context);
}

class EnsureChainImpl<T> implements EnsureChain<T> {
  private readonly context: AssertionContext<T>;

  constructor(context: AssertionContext<T>) {
    this.context = context;
  }

  public get value(): T {
    return this.context.value;
  }

  public toBe(expected: T): EnsureChain<T> {
    const actual = this.context.value;
    if (!Object.is(actual, expected)) {
      this.fail("toBe", {
        message: buildFailureMessage("toBe", "Expected values to be strictly equal", {
          expected,
          actual,
          diff: formatDiff(expected, actual),
        }),
        expected,
        actual,
      });
    }
    return this;
  }

  public toEqual(expected: unknown): EnsureChain<T> {
    const actual = this.context.value;
    if (!equals(actual, expected, EQUALITY_TESTERS)) {
      this.fail("toEqual", {
        message: buildFailureMessage("toEqual", "Expected values to be deeply equal", {
          expected,
          actual,
          diff: formatDiff(expected, actual),
        }),
        expected,
        actual,
      });
    }
    return this;
  }

  public toStrictEqual(expected: unknown): EnsureChain<T> {
    const actual = this.context.value;
    if (!equals(actual, expected, EQUALITY_TESTERS, true)) {
      this.fail("toStrictEqual", {
        message: buildFailureMessage(
          "toStrictEqual",
          "Expected values to be strictly equal (including prototypes and property definitions)",
          {
            expected,
            actual,
            diff: formatDiff(expected, actual),
          }
        ),
        expected,
        actual,
      });
    }
    return this;
  }

  public toBeDefined(): EnsureChain<NonNullable<T>> {
    const actual = this.context.value;
    if (actual === null || typeof actual === "undefined") {
      this.fail("toBeDefined", {
        message: buildFailureMessage("toBeDefined", NIL_MESSAGE, { actual }),
        actual,
      });
    }
    return this.rewrap(actual as NonNullable<T>);
  }

  public toBeUndefined(): EnsureChain<undefined> {
    const actual = this.context.value;
    if (typeof actual !== "undefined") {
      this.fail("toBeUndefined", {
        message: buildFailureMessage("toBeUndefined", "Expected value to be undefined", { actual }),
        actual,
      });
    }
    return this.rewrap(undefined);
  }

  public toBeNull(): EnsureChain<null> {
    const actual = this.context.value;
    if (actual !== null) {
      this.fail("toBeNull", {
        message: buildFailureMessage("toBeNull", "Expected value to be null", { actual }),
        actual,
      });
    }
    return this.rewrap(null);
  }

  public toBeTruthy(): EnsureChain<T> {
    const actual = this.context.value;
    if (!actual) {
      this.fail("toBeTruthy", {
        message: buildFailureMessage("toBeTruthy", "Expected value to be truthy", { actual }),
        actual,
      });
    }
    return this;
  }

  public toBeFalsy(): EnsureChain<T> {
    const actual = this.context.value;
    if (actual) {
      this.fail("toBeFalsy", {
        message: buildFailureMessage("toBeFalsy", "Expected value to be falsy", { actual }),
        actual,
      });
    }
    return this;
  }

  public toBeInstanceOf<Ctor extends abstract new (...args: never[]) => unknown>(
    ctor: Ctor
  ): EnsureChain<InstanceType<Ctor>> {
    const actual = this.context.value;
    if (typeof ctor !== "function") {
      this.fail("toBeInstanceOf", {
        message: buildFailureMessage("toBeInstanceOf", "Constructor must be a callable function", {
          expected: ctor,
        }),
        expected: ctor,
      });
    }

    if (!(actual instanceof ctor)) {
      const label = ctor.name || "<anonymous>";
      this.fail("toBeInstanceOf", {
        message: buildFailureMessage("toBeInstanceOf", `Expected value to be an instance of ${label}`, {
          expected: ctor,
          actual,
        }),
        expected: ctor,
        actual,
      });
    }
    return this.rewrap(actual as InstanceType<Ctor>);
  }

  public toBeObjectContaining<Shape extends Record<PropertyKey, unknown>>(
    shape: Shape
  ): EnsureChain<T> {
    const actual = this.context.value;
    if (!isRecord(actual)) {
      this.fail("toBeObjectContaining", {
        message: buildFailureMessage("toBeObjectContaining", "Expected value to be an object", {
          actual,
        }),
        actual,
      });
    }

    if (!equals(actual, shape, SUBSET_TESTERS)) {
      this.fail("toBeObjectContaining", {
        message: buildFailureMessage(
          "toBeObjectContaining",
          "Object does not match the provided subset",
          {
            expected: shape,
            actual,
            diff: formatDiff(shape, actual),
          }
        ),
        expected: shape,
        actual,
      });
    }

    return this;
  }

  public toBeArrayContaining(expected: readonly unknown[]): EnsureChain<T & readonly unknown[]> {
    const actual = this.context.value;
    if (!Array.isArray(actual)) {
      this.fail("toBeArrayContaining", {
        message: buildFailureMessage("toBeArrayContaining", "Expected value to be an array", {
          actual,
        }),
        actual,
      });
    }

    const receivedArray = actual as readonly unknown[];
    const missing = expected.filter((item) =>
      !receivedArray.some((entry) => equals(entry, item, EQUALITY_TESTERS))
    );

    if (missing.length > 0) {
      this.fail("toBeArrayContaining", {
        message: buildFailureMessage(
          "toBeArrayContaining",
          "Array is missing expected elements",
          {
            expected,
            actual: receivedArray,
            extra: [formatMissingList("Missing elements:", missing)],
            diff: formatDiff(expected, receivedArray),
          }
        ),
        expected,
        actual: receivedArray,
      });
    }

    return this.rewrap(receivedArray as T & readonly unknown[]);
  }

  public toContainEqual(expected: unknown): EnsureChain<T & readonly unknown[]> {
    const actual = this.context.value;
    if (!Array.isArray(actual)) {
      this.fail("toContainEqual", {
        message: buildFailureMessage("toContainEqual", "Expected value to be an array", {
          actual,
        }),
        actual,
      });
    }

    const receivedArray = actual as readonly unknown[];
    const hasItem = receivedArray.some((entry) => equals(entry, expected, EQUALITY_TESTERS));

    if (!hasItem) {
      this.fail("toContainEqual", {
        message: buildFailureMessage("toContainEqual", "Array is missing the expected element", {
          expected,
          actual: receivedArray,
          diff: formatDiff(expected, receivedArray),
        }),
        expected,
        actual: receivedArray,
      });
    }

    return this.rewrap(receivedArray as T & readonly unknown[]);
  }

  public toBeIterableContaining(expected: readonly unknown[]): EnsureChain<T & Iterable<unknown>> {
    const actual = this.context.value;
    if (!isIterable(actual)) {
      this.fail("toBeIterableContaining", {
        message: buildFailureMessage("toBeIterableContaining", "Expected value to be iterable", {
          actual,
        }),
        actual,
      });
    }

    const entries = Array.from(actual as Iterable<unknown>);
    const missing = expected.filter((item) =>
      !entries.some((entry) => equals(entry, item, EQUALITY_TESTERS))
    );

    if (missing.length > 0) {
      this.fail("toBeIterableContaining", {
        message: buildFailureMessage(
          "toBeIterableContaining",
          "Iterable is missing expected elements",
          {
            expected,
            actual: entries,
            extra: [formatMissingList("Missing elements:", missing)],
          }
        ),
        expected,
        actual: entries,
      });
    }

    return this.rewrap(actual as T & Iterable<unknown>);
  }

  public toHaveLength(expected: number): EnsureChain<T & { length: number }> {
    if (!hasLengthProperty(this.context.value)) {
      this.fail("toHaveLength", {
        message: buildFailureMessage("toHaveLength", "Expected value to have a numeric length property", {
          actual: this.context.value,
        }),
        actual: this.context.value,
      });
    }

    const actualLength = (this.context.value as { length: number }).length;
    if (actualLength !== expected) {
      this.fail("toHaveLength", {
        message: buildFailureMessage("toHaveLength", "Length does not match expectation", {
          expected,
          actual: actualLength,
          diff: formatDiff(expected, actualLength),
        }),
        expected,
        actual: actualLength,
      });
    }

    return this.rewrap(this.context.value as T & { length: number });
  }

  private rewrap<U>(value: U): EnsureChain<U> {
    const nextContext = this.context.label !== undefined
      ? ({ value, label: this.context.label } satisfies AssertionContext<U>)
      : ({ value } satisfies AssertionContext<U>);
    return new EnsureChainImpl<U>(nextContext);
  }

  private fail(matcher: string, options: { message: string; actual?: unknown; expected?: unknown }): never {
    const details: EnsureErrorDetails = {
      matcher,
      message: options.message,
      ...(options.actual !== undefined ? { actual: options.actual } : {}),
      ...(options.expected !== undefined ? { expected: options.expected } : {}),
      ...(this.context.label !== undefined ? { receivedLabel: this.context.label } : {}),
    };
    throw new EnsureError(details);
  }
}

interface FailureMessageOptions {
  readonly expected?: unknown;
  readonly actual?: unknown;
  readonly diff?: string | undefined;
  readonly extra?: readonly (string | undefined)[];
}

function buildFailureMessage(
  matcher: string,
  baseMessage: string,
  options: FailureMessageOptions = {}
): string {
  const sections: string[] = [
    `${MATCHER_CALL}.${matcher}(expected)`,
    baseMessage,
  ];

  if (Object.prototype.hasOwnProperty.call(options, "expected")) {
    sections.push(`Expected: ${printExpected(options.expected)}`);
  }

  if (Object.prototype.hasOwnProperty.call(options, "actual")) {
    sections.push(`Received: ${printReceived(options.actual)}`);
  }

  if (options.extra) {
    for (const extra of options.extra) {
      if (extra && extra.trim().length > 0) {
        sections.push(extra);
      }
    }
  }

  if (options.diff && options.diff.trim().length > 0) {
    sections.push(options.diff);
  }

  return sections.join("\n\n");
}

function formatDiff(expected: unknown, actual: unknown): string | undefined {
  const difference = diff(expected, actual, { expand: false });
  return difference && difference.trim().length > 0 ? difference : undefined;
}

function formatMissingList(title: string, values: readonly unknown[]): string {
  if (values.length === 0) {
    return "";
  }
  const items = values.map((value) => `  - ${printExpected(value)}`).join("\n");
  return `${title}\n${items}`;
}

function isRecord(candidate: unknown): candidate is Record<PropertyKey, unknown> {
  return typeof candidate === "object" && candidate !== null;
}

function isIterable(candidate: unknown): candidate is Iterable<unknown> {
  return typeof (candidate as { [Symbol.iterator]?: unknown })?.[Symbol.iterator] === "function";
}

function hasLengthProperty(candidate: unknown): candidate is { length: number } {
  return typeof (candidate as { length?: unknown })?.length === "number";
}
