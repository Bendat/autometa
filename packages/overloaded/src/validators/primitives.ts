import type { ValidatorInstance } from "../core/types";
import { createValidator, type ValidatorOptions } from "./base";

export interface StringValidatorOptions extends ValidatorOptions {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly predicate?: (value: string) => boolean;
  readonly summary?: string;
}

export interface NumberValidatorOptions extends ValidatorOptions {
  readonly min?: number;
  readonly max?: number;
  readonly integer?: boolean;
  readonly finite?: boolean;
  readonly predicate?: (value: number) => boolean;
  readonly summary?: string;
}

export interface BooleanValidatorOptions extends ValidatorOptions {
  readonly summary?: string;
}

export interface LiteralValidatorOptions<T> extends ValidatorOptions {
  readonly summary?: string;
  readonly describeValue?: (value: T) => string;
}

export interface UnknownValidatorOptions extends ValidatorOptions {
  readonly summary?: string;
}

export interface FunctionValidatorOptions extends ValidatorOptions {
  readonly arity?: number;
  readonly summary?: string;
}

export interface TypeOfValidatorOptions extends ValidatorOptions {
  readonly summary?: string;
}

export function string(options: StringValidatorOptions = {}): ValidatorInstance<string> {
  const hasConstraints =
    options.minLength !== undefined || options.maxLength !== undefined || options.pattern !== undefined || options.predicate !== undefined;
  const specificity = options.specificity ?? (hasConstraints ? 3 : 2);
  const summary = options.summary ?? "string";

  return createValidator<string>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      if (typeof value !== "string") {
        ctx.report({
          message: `Expected ${summary} but received ${describeValue(value)}`,
          actual: value,
          expected: summary,
        });
        return false;
      }

      if (options.minLength !== undefined && value.length < options.minLength) {
        ctx.report({
          message: `Expected string length ≥ ${options.minLength}, received ${value.length}`,
          actual: value,
          expected: `${summary} length ≥ ${options.minLength}`,
        });
        return false;
      }

      if (options.maxLength !== undefined && value.length > options.maxLength) {
        ctx.report({
          message: `Expected string length ≤ ${options.maxLength}, received ${value.length}`,
          actual: value,
          expected: `${summary} length ≤ ${options.maxLength}`,
        });
        return false;
      }

      if (options.pattern && !options.pattern.test(value)) {
        ctx.report({
          message: `Expected string to match ${options.pattern}`,
          actual: value,
          expected: `${summary} matching ${options.pattern}`,
        });
        return false;
      }

      if (options.predicate && !options.predicate(value)) {
        ctx.report({
          message: `String predicate failed`,
          actual: value,
          expected: summary,
        });
        return false;
      }

      return true;
    },
  });
}

export function number(options: NumberValidatorOptions = {}): ValidatorInstance<number> {
  const hasConstraints =
    options.min !== undefined || options.max !== undefined || options.integer === true || options.finite === true || options.predicate !== undefined;
  const specificity = options.specificity ?? (hasConstraints ? 3 : 2);
  const summary = options.summary ?? "number";

  return createValidator<number>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      if (typeof value !== "number" || Number.isNaN(value)) {
        ctx.report({
          message: `Expected ${summary} but received ${describeValue(value)}`,
          actual: value,
          expected: summary,
        });
        return false;
      }

      if (options.finite && !Number.isFinite(value)) {
        ctx.report({
          message: `Expected finite number`,
          actual: value,
          expected: `${summary} (finite)`,
        });
        return false;
      }

      if (options.integer && !Number.isInteger(value)) {
        ctx.report({
          message: `Expected integer`,
          actual: value,
          expected: `${summary} (integer)`,
        });
        return false;
      }

      if (options.min !== undefined && value < options.min) {
        ctx.report({
          message: `Expected number ≥ ${options.min}, received ${value}`,
          actual: value,
          expected: `${summary} ≥ ${options.min}`,
        });
        return false;
      }

      if (options.max !== undefined && value > options.max) {
        ctx.report({
          message: `Expected number ≤ ${options.max}, received ${value}`,
          actual: value,
          expected: `${summary} ≤ ${options.max}`,
        });
        return false;
      }

      if (options.predicate && !options.predicate(value)) {
        ctx.report({
          message: `Number predicate failed`,
          actual: value,
          expected: summary,
        });
        return false;
      }

      return true;
    },
  });
}

export function boolean(options: BooleanValidatorOptions = {}): ValidatorInstance<boolean> {
  const summary = options.summary ?? "boolean";
  const specificity = options.specificity ?? 2;

  return createValidator<boolean>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      if (typeof value !== "boolean") {
        ctx.report({
          message: `Expected ${summary} but received ${describeValue(value)}`,
          actual: value,
          expected: summary,
        });
        return false;
      }
      return true;
    },
  });
}

export function literal<T>(expectedValue: T, options?: LiteralValidatorOptions<T>): ValidatorInstance<T>;
export function literal<T>(expectedValues: ReadonlyArray<T>, options?: LiteralValidatorOptions<T>): ValidatorInstance<T>;
export function literal<T>(
  expected: T | ReadonlyArray<T>,
  options: LiteralValidatorOptions<T> = {}
): ValidatorInstance<T> {
  const values = (Array.isArray(expected) ? expected : [expected]) as ReadonlyArray<T>;
  const describeLiteral = options.describeValue ?? describeValue;
  const summary = options.summary ?? formatLiteralSummary(values.map((value) => describeLiteral(value)));
  const specificity = options.specificity ?? 5;

  return createValidator<T>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      if (!values.some((candidate) => Object.is(candidate, value))) {
        ctx.report({
          message: `Expected ${summary} but received ${describeValue(value)}`,
          actual: value,
          expected: summary,
        });
        return false;
      }
      return true;
    },
  });
}

export function unknown(options: UnknownValidatorOptions = {}): ValidatorInstance<unknown> {
  const summary = options.summary ?? "unknown";
  const specificity = options.specificity ?? 0;

  return createValidator<unknown>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate() {
      return true;
    },
  });
}

export function func(options: FunctionValidatorOptions = {}): ValidatorInstance<(...args: unknown[]) => unknown> {
  const summary = options.summary ?? "function";
  const hasArityConstraint = options.arity !== undefined;
  const specificity = options.specificity ?? (hasArityConstraint ? 3 : 2);

  return createValidator<(...args: unknown[]) => unknown>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      if (typeof value !== "function") {
        ctx.report({
          message: `Expected ${summary} but received ${describeValue(value)}`,
          actual: value,
          expected: summary,
        });
        return false;
      }

      if (options.arity !== undefined && value.length !== options.arity) {
        ctx.report({
          message: `Expected function arity ${options.arity}, received ${value.length}`,
          actual: value.length,
          expected: options.arity,
        });
        return false;
      }

      return true;
    },
  });
}

export function typeOf<TConstructor extends new (...args: never[]) => unknown>(
  ctor: TConstructor,
  options: TypeOfValidatorOptions = {}
): ValidatorInstance<TConstructor> {
  const summary = options.summary ?? `typeof ${ctor.name || "<anonymous>"}`;
  const specificity = options.specificity ?? 3;

  return createValidator<TConstructor>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      if (value === undefined && options.optional) {
        return true;
      }
      if (value !== ctor) {
        ctx.report({
          message: `Expected ${summary} but received ${describeValue(value)}`,
          actual: value,
          expected: summary,
        });
        return false;
      }
      return true;
    },
  });
}

export function describeValue(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "number") {
    return Number.isNaN(value) ? "NaN" : value.toString();
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "function") {
    return value.name ? `[Function ${value.name}]` : "[Function anonymous]";
  }
  if (Array.isArray(value)) {
    return `[${value.map(describeValue).join(", ")}]`;
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

function formatLiteralSummary(values: ReadonlyArray<string>): string {
  const [first, ...rest] = values;
  if (first === undefined) {
    return "<empty>";
  }
  if (rest.length === 0) {
    return first;
  }
  return [first, ...rest].join(" | ");
}
