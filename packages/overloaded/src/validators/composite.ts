import type { ValidationIssue, ValidatorInstance } from "../core/types";
import {
  createValidator,
  type ValidatorOptions,
  type ValidatorRuntimeContext,
} from "./base";
import { describeValue } from "./primitives";

export interface ArrayValidatorOptions extends ValidatorOptions {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly length?: number;
  readonly summary?: string;
}

export interface TupleValidatorOptions extends ValidatorOptions {
  readonly allowExtra?: boolean;
  readonly summary?: string;
}

export interface ShapeValidatorOptions extends ValidatorOptions {
  readonly allowUnknownProperties?: boolean;
  readonly summary?: string;
}

export interface UnionValidatorOptions extends ValidatorOptions {
  readonly summary?: string;
}

export interface IntersectionValidatorOptions extends ValidatorOptions {
  readonly summary?: string;
}

export interface InstanceValidatorOptions extends ValidatorOptions {
  readonly summary?: string;
}

type ValidatorValue<T> = T extends ValidatorInstance<infer V> ? V : never;

type UnionValues<T extends readonly ValidatorInstance[]> = ValidatorValue<T[number]>;

type IntersectionValues<T extends readonly ValidatorInstance[]> = T extends readonly [infer Head, ...infer Rest]
  ? Head extends ValidatorInstance<infer V>
    ? Rest extends readonly ValidatorInstance[]
      ? V & IntersectionValues<Rest>
      : V
    : never
  : unknown;

export function array<T>(
  validator: ValidatorInstance<T> | ReadonlyArray<ValidatorInstance<T>>,
  options: ArrayValidatorOptions = {}
): ValidatorInstance<T[]> {
  const validators = Array.isArray(validator) ? [...validator] : [validator];
  const summary = options.summary ?? `array<${validators.map((item) => item.summary).join(" | ") || "unknown"}>`;
  const specificity = options.specificity ?? 3;

  return createValidator<T[]>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      if (!Array.isArray(value)) {
        ctx.report({
          message: `Expected ${summary} but received ${describeValue(value)}`,
          actual: value,
          expected: summary,
        });
        return false;
      }

      if (options.length !== undefined && value.length !== options.length) {
        ctx.report({
          message: `Expected array length ${options.length}, received ${value.length}`,
          actual: value.length,
          expected: options.length,
        });
        return false;
      }

      if (options.minLength !== undefined && value.length < options.minLength) {
        ctx.report({
          message: `Expected minimum length ${options.minLength}, received ${value.length}`,
          actual: value.length,
          expected: options.minLength,
        });
        return false;
      }

      if (options.maxLength !== undefined && value.length > options.maxLength) {
        ctx.report({
          message: `Expected maximum length ${options.maxLength}, received ${value.length}`,
          actual: value.length,
          expected: options.maxLength,
        });
        return false;
      }

      for (const [index, element] of value.entries()) {
        const elementPath = [...ctx.path, index];
        let matched = false;
        let issues: ValidationIssue[] = [];

        for (const candidate of validators) {
          const result = candidate.validate(element, elementPath);
          if (result.ok) {
            matched = true;
            break;
          }
          issues = [...issues, ...result.issues];
        }

        if (!matched) {
          if (issues.length > 0) {
            forwardIssues(ctx, issues);
          } else {
            ctx.report({
              path: elementPath,
              message: `Element did not satisfy ${summary}`,
              actual: element,
            });
          }
          return false;
        }
      }

      return true;
    },
  });
}

export function tuple<T extends readonly ValidatorInstance[]>(
  validators: T,
  options: TupleValidatorOptions = {}
): ValidatorInstance<unknown[]> {
  const summary = options.summary ?? `tuple<[${validators.map((item) => item.summary).join(", ")}]>`;
  const specificity = options.specificity ?? 4;
  const requiredCount = validators.reduce((count, validator) => (validator.optional ? count : count + 1), 0);

  return createValidator<unknown[]>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      if (!Array.isArray(value)) {
        ctx.report({
          message: `Expected ${summary} but received ${describeValue(value)}`,
          actual: value,
          expected: summary,
        });
        return false;
      }

      if (value.length < requiredCount) {
        ctx.report({
          message: `Expected at least ${requiredCount} elements, received ${value.length}`,
          actual: value.length,
          expected: requiredCount,
        });
        return false;
      }

      if (!options.allowExtra && value.length > validators.length) {
        ctx.report({
          message: `Expected at most ${validators.length} elements, received ${value.length}`,
          actual: value.length,
          expected: validators.length,
        });
        return false;
      }

      for (const [index, validator] of validators.entries()) {
        if (!validator) {
          continue;
        }
        const elementPath = [...ctx.path, index];
        const element = value[index];

        if (element === undefined && index >= value.length) {
          if (!validator.optional) {
            ctx.report({
              path: elementPath,
              message: "Tuple element is required but missing",
            });
            return false;
          }
          continue;
        }

        if (element === undefined && validator.optional) {
          continue;
        }

        const result = validator.validate(element, elementPath);
        if (!result.ok) {
          forwardIssues(ctx, result.issues);
          return false;
        }
      }

      return true;
    },
  });
}

export function shape<TSchema extends Record<string, ValidatorInstance>>(
  schema: TSchema,
  options: ShapeValidatorOptions = {}
): ValidatorInstance<Record<string, unknown>> {
  const keys = Object.keys(schema);
  const summary = options.summary ?? `shape<{${keys.join(", ")}}>`;
  const specificity = options.specificity ?? 4;

  return createValidator<Record<string, unknown>>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        ctx.report({
          message: `Expected ${summary} but received ${describeValue(value)}`,
          actual: value,
          expected: summary,
        });
        return false;
      }

      const record = value as Record<string, unknown>;

      for (const key of keys) {
        const validator = schema[key];
        if (!validator) {
          continue;
        }
        const elementPath = [...ctx.path, key];

        if (!Object.prototype.hasOwnProperty.call(record, key)) {
          if (!validator.optional) {
            ctx.report({
              path: elementPath,
              message: "Property is required but missing",
            });
            return false;
          }
          continue;
        }

        const propertyValue = record[key];
        const result = validator.validate(propertyValue, elementPath);
        if (!result.ok) {
          forwardIssues(ctx, result.issues);
          return false;
        }
      }

      if (!options.allowUnknownProperties) {
        for (const key of Object.keys(record)) {
          if (!schema[key]) {
            ctx.report({
              path: [...ctx.path, key],
              message: `Unexpected property "${key}"`,
            });
            return false;
          }
        }
      }

      return true;
    },
  });
}

export function union<T extends readonly ValidatorInstance[]>(
  validators: T,
  options: UnionValidatorOptions = {}
): ValidatorInstance<UnionValues<T>> {
  if (validators.length === 0) {
    throw new Error("union requires at least one validator");
  }

  const summary = options.summary ?? `union<${validators.map((validator) => validator.summary).join(" | ")}>`;
  const specificity = options.specificity ?? validators.reduce((max, validator) => Math.max(max, validator.specificity), 0);

  return createValidator<UnionValues<T>>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      const issues: ValidationIssue[] = [];

      for (const validator of validators) {
        const result = validator.validate(value, ctx.path);
        if (result.ok) {
          return true;
        }
        issues.push(...result.issues);
      }

      if (issues.length === 0) {
        ctx.report({
          message: `Value did not satisfy ${summary}`,
          expected: summary,
        });
        return false;
      }

      for (const issue of issues) {
        ctx.report(issue);
      }

      return false;
    },
  });
}

export function intersection<T extends readonly ValidatorInstance[]>(
  validators: T,
  options: IntersectionValidatorOptions = {}
): ValidatorInstance<IntersectionValues<T>> {
  if (validators.length === 0) {
    throw new Error("intersection requires at least one validator");
  }

  const summary = options.summary ?? `intersection<${validators.map((validator) => validator.summary).join(" & ")}>`;
  const specificity = options.specificity ?? validators.reduce((total, validator) => total + validator.specificity, 0);

  return createValidator<IntersectionValues<T>>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      for (const validator of validators) {
        const result = validator.validate(value, ctx.path);
        if (!result.ok) {
          for (const issue of result.issues) {
            ctx.report(issue);
          }
          return false;
        }
      }

      return true;
    },
  });
}

export function instanceOf<T>(
  ctor: new (...args: never[]) => T,
  validator?: ValidatorInstance,
  options: InstanceValidatorOptions = {}
): ValidatorInstance<T> {
  const name = ctor.name || "<anonymous>";
  const summary = options.summary ?? `instanceof ${name}`;
  const specificity = options.specificity ?? (validator ? Math.max(validator.specificity + 1, 4) : 4);

  return createValidator<T>({
    summary,
    specificity,
    optional: options.optional ?? false,
    validate(value, ctx) {
      if (value === undefined && options.optional) {
        return true;
      }

      if (!(value instanceof ctor)) {
        ctx.report({
          message: `Expected ${summary} but received ${describeValue(value)}`,
          actual: value,
          expected: summary,
        });
        return false;
      }

      if (!validator) {
        return true;
      }

  const result = validator.validate(value, ctx.path);
      if (!result.ok) {
        forwardIssues(ctx, result.issues);
        return false;
      }

      return true;
    },
  });
}

function forwardIssues(ctx: ValidatorRuntimeContext, issues: ValidationIssue[]): void {
  for (const issue of issues) {
    ctx.report(issue);
  }
}
