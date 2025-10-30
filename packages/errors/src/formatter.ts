import { AutomationError } from "./automation-error";

export interface FormatErrorCausesOptions {
  readonly includeStack?: boolean;
  readonly describeValue?: (value: unknown) => string;
  readonly maxDepth?: number;
}

interface ErrorWithCause extends Error {
  readonly cause?: unknown;
}

function hasCause(error: Error): error is ErrorWithCause {
  return "cause" in error;
}

function formatError(error: Error, includeStack: boolean): string {
  const header = `${error.name}: ${error.message}`;
  if (!includeStack) {
    return header;
  }
  const stack = error.stack ?? "<no stack trace available>";
  return `${header}\nStacktrace:\n${stack}`;
}

function describeUnknown(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Produce a multi-line description summarising the error and its causes.
 */
export function formatErrorCauses(error: AutomationError, options: FormatErrorCausesOptions = {}): string {
  const {
    includeStack = true,
    describeValue = describeUnknown,
    maxDepth = Number.POSITIVE_INFINITY,
  } = options;

  const segments: string[] = [];
  const visited = new Set<Error>();
  let current: ErrorWithCause | undefined = error;
  let depth = 0;

  while (current) {
    segments.push(formatError(current, includeStack));

    if (depth >= maxDepth) {
      if (hasCause(current) && current.cause !== undefined) {
        segments.push("[max depth reached]");
      }
      break;
    }

    visited.add(current);
    if (!hasCause(current) || current.cause === undefined) {
      break;
    }

  const cause: unknown = current.cause;
    if (!(cause instanceof Error)) {
      segments.push(describeValue(cause));
      break;
    }

    if (visited.has(cause)) {
      segments.push("[cycle detected in error causes]");
      break;
    }

    current = cause;
    depth += 1;
  }

  return segments.join("\nCause:\n");
}
