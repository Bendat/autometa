import type { ValidationIssue, ValidationPath, ValidationResult, ValidatorInstance } from "../core/types";

export interface ValidatorOptions {
  readonly optional?: boolean;
  readonly specificity?: number;
}

export interface ValidatorRuntimeContext {
  readonly path: ValidationPath;
  report(issue: ReportableIssue): void;
  child(segment: string | number): ValidatorRuntimeContext;
}

export interface ReportableIssue {
  readonly message: string;
  readonly expected?: unknown;
  readonly actual?: unknown;
  readonly path?: ValidationPath;
}

export type ValidatorOutcome<T> = boolean | void | ValidationResult<T>;

export interface CreateValidatorConfig<T> {
  readonly summary: string;
  readonly specificity: number;
  readonly optional?: boolean;
  readonly validate: (value: unknown, ctx: ValidatorRuntimeContext) => ValidatorOutcome<T>;
}

export function createValidator<T>(config: CreateValidatorConfig<T>): ValidatorInstance<T> {
  const optional = config.optional ?? false;
  const specificity = config.specificity;
  const summary = config.summary;

  return {
    optional,
    specificity,
    summary,
    validate(value, path) {
      const collected: ValidationIssue[] = [];
      const context = createRuntimeContext(path, collected);
      const outcome = config.validate(value, context);
      return normalizeOutcome(outcome, collected, path, summary);
    },
  };
}

export function success<T>(value?: T): ValidationResult<T> {
  if (value === undefined) {
    return { ok: true, issues: [] };
  }
  return { ok: true, issues: [], value };
}

export function failure(issue: ValidationIssue | ValidationIssue[]): ValidationResult<never> {
  return {
    ok: false,
    issues: Array.isArray(issue) ? issue : [issue],
  };
}

function createRuntimeContext(path: ValidationPath, sink: ValidationIssue[]): ValidatorRuntimeContext {
  return {
    path,
    report(issue) {
      sink.push({
        path: issue.path ?? path,
        message: issue.message,
        expected: issue.expected,
        actual: issue.actual,
      });
    },
    child(segment) {
      return createRuntimeContext([...path, segment], sink);
    },
  };
}

function normalizeOutcome<T>(
  outcome: ValidatorOutcome<T>,
  collected: ValidationIssue[],
  path: ValidationPath,
  summary: string
): ValidationResult<T> {
  if (outcome === undefined) {
    return finalize(collected, path, summary, true);
  }

  if (typeof outcome === "boolean") {
    const ok = outcome && collected.length === 0;
    return finalize(collected, path, summary, ok);
  }

  const mergedIssues = [...collected, ...outcome.issues.map((issue) => ensurePath(issue, path))];
  const ok = outcome.ok && mergedIssues.length === 0 ? true : outcome.ok;
  const issues = !ok && mergedIssues.length === 0 ? [{ path, message: `Value did not satisfy ${summary}` }] : mergedIssues;
  if (outcome.value === undefined) {
    return { ok, issues };
  }
  return { ok, issues, value: outcome.value };
}

function ensurePath(issue: ValidationIssue, fallback: ValidationPath): ValidationIssue {
  if (issue.path.length > 0) {
    return issue;
  }
  return { ...issue, path: fallback };
}

function finalize<T>(
  collected: ValidationIssue[],
  path: ValidationPath,
  summary: string,
  ok: boolean
): ValidationResult<T> {
  if (ok) {
    return { ok: true, issues: [] };
  }

  const issues = collected.length > 0 ? collected : [{ path, message: `Value did not satisfy ${summary}` }];
  return { ok: false, issues };
}
