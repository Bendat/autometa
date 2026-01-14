import type { NormalizedSignature, SignatureFailureReport } from "./types";

export class AmbiguousOverloadError extends Error {
  readonly matches: ReadonlyArray<NormalizedSignature>;

  constructor(message: string, matches: ReadonlyArray<NormalizedSignature>) {
    super(message);
    this.name = "AmbiguousOverloadError";
    this.matches = matches;
  }
}

export class NoOverloadMatchedError extends Error {
  readonly args: ReadonlyArray<unknown>;
  readonly failures: ReadonlyArray<SignatureFailureReport>;

  constructor(args: ReadonlyArray<unknown>, failures: ReadonlyArray<SignatureFailureReport>) {
    super(buildMessage(args, failures));
    this.name = "NoOverloadMatchedError";
    this.args = args;
    this.failures = failures;
  }
}

function buildMessage(
  args: ReadonlyArray<unknown>,
  failures: ReadonlyArray<SignatureFailureReport>
): string {
  const header = `No overload matched for (${args.map(stringifyArg).join(", ")})`;
  const detail = failures
    .map((failure) => {
      const signatureLabel = failure.signature.name ?? `overload#${failure.signature.id}`;
      const expected = failure.expected.join(", ");
      const issues = failure.issues
        .map((issue) => `    - ${formatPath(issue.path)} ${issue.message}`)
        .join("\n");
      return [`• ${signatureLabel}`, `  Expected: ${expected}`, issues].filter(Boolean).join("\n");
    })
    .join("\n\n");

  return [header, detail].filter(Boolean).join("\n\n");
}

function stringifyArg(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "function") {
    return value.name ? `[Function ${value.name}]` : "[Function anonymous]";
  }
  if (typeof value === "object") {
    const ctorName = (value as { constructor?: { name?: string } })?.constructor?.name;
    if (ctorName && ctorName !== "Object") {
      return `[${ctorName}]`;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

function formatPath(path: ReadonlyArray<string | number>): string {
  if (path.length === 0) {
    return "";
  }
  return path
    .map((segment) => (typeof segment === "number" ? `[${segment}]` : segment))
    .join(".");
}
