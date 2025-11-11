export interface FormatErrorCausesOptions {
  readonly includeStack?: boolean;
  readonly describeValue?: (value: unknown) => string;
  readonly maxDepth?: number;
}

export interface FormatErrorTreeOptions extends FormatErrorCausesOptions {
  /**
   * Text used to indent nested causes. Defaults to two spaces.
   */
  readonly indent?: string;
  /**
   * Bullet prefix rendered before each error/value. Defaults to `•`.
   */
  readonly bullet?: string;
}

export interface PrintErrorTreeOptions extends FormatErrorTreeOptions {
  readonly writer?: (line: string) => void;
}

interface ErrorWithCause extends Error {
  readonly cause?: unknown;
}

interface ErrorChainEntryError {
  readonly kind: "error";
  readonly error: Error;
  readonly depth: number;
}

interface ErrorChainEntryValue {
  readonly kind: "value";
  readonly value: string;
  readonly depth: number;
}

interface ErrorChainEntryNotice {
  readonly kind: "notice";
  readonly message: string;
  readonly depth: number;
}

type ErrorChainEntry =
  | ErrorChainEntryError
  | ErrorChainEntryValue
  | ErrorChainEntryNotice;

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

function buildErrorChain(
  root: Error,
  describeValue: (value: unknown) => string,
  maxDepth: number
): ErrorChainEntry[] {
  const entries: ErrorChainEntry[] = [];
  const visited = new Set<Error>();

  let current: ErrorWithCause | undefined = root;
  let depth = 0;

  while (current) {
    entries.push({ kind: "error", error: current, depth });

    if (depth >= maxDepth) {
      if (hasCause(current) && current.cause !== undefined) {
        entries.push({
          kind: "notice",
          message: "[max depth reached]",
          depth: depth + 1,
        });
      }
      break;
    }

    visited.add(current);

    if (!hasCause(current) || current.cause === undefined) {
      break;
    }

    const cause: unknown = current.cause;
    if (!(cause instanceof Error)) {
      entries.push({
        kind: "value",
        value: describeValue(cause),
        depth: depth + 1,
      });
      break;
    }

    if (visited.has(cause)) {
      entries.push({
        kind: "notice",
        message: "[cycle detected in error causes]",
        depth: depth + 1,
      });
      break;
    }

    current = cause;
    depth += 1;
  }

  return entries;
}

/**
 * Produce a multi-line description summarising the error and its causes.
 */
export function formatErrorCauses(error: Error, options: FormatErrorCausesOptions = {}): string {
  const {
    includeStack = true,
    describeValue = describeUnknown,
    maxDepth = Number.POSITIVE_INFINITY,
  } = options;

  const entries = buildErrorChain(error, describeValue, maxDepth);
  const segments = entries.map((entry) => {
    if (entry.kind === "error") {
      return formatError(entry.error, includeStack);
    }
    return entry.kind === "value" ? entry.value : entry.message;
  });

  return segments.join("\nCause:\n");
}

/**
 * Render the error cause chain as an indented tree, suitable for logging.
 */
export function formatErrorTree(error: Error, options: FormatErrorTreeOptions = {}): string {
  const {
    includeStack = true,
    describeValue = describeUnknown,
    maxDepth = Number.POSITIVE_INFINITY,
    indent = "  ",
    bullet = "•",
  } = options;

  const entries = buildErrorChain(error, describeValue, maxDepth);
  const lines: string[] = [];

  for (const entry of entries) {
    const content =
      entry.kind === "error"
        ? formatError(entry.error, includeStack)
        : entry.kind === "value"
          ? entry.value
          : entry.message;

    appendIndentedContent(lines, content, entry.depth, indent, bullet);
  }

  return lines.join("\n");
}

export function printErrorTree(error: Error, options: PrintErrorTreeOptions = {}): void {
  const { writer = (line: string) => console.error(line), ...rest } = options;
  const formatted = formatErrorTree(error, rest);
  for (const line of formatted.split("\n")) {
    writer(line);
  }
}

function appendIndentedContent(
  lines: string[],
  content: string,
  depth: number,
  indent: string,
  bullet: string
) {
  const padding = indent.repeat(depth);
  const parts = content.split("\n");
  lines.push(`${padding}${bullet} ${parts[0]}`);
  for (let index = 1; index < parts.length; index += 1) {
    lines.push(`${padding}${indent}${parts[index]}`);
  }
}
