import { inspect } from "node:util";

export interface EnsureErrorDetails {
  readonly matcher: string;
  readonly message: string;
  readonly actual?: unknown;
  readonly expected?: unknown;
  readonly receivedLabel?: string;
}

export class EnsureError extends Error {
  public readonly matcher: string;
  public readonly actual?: unknown;
  public readonly expected?: unknown;

  constructor(details: EnsureErrorDetails) {
    const formattedMessage = buildMessage(details);
    super(formattedMessage);
    this.name = "EnsureError";
    this.matcher = details.matcher;
    this.actual = details.actual;
    this.expected = details.expected;
  }
}

function buildMessage({ matcher, message, actual, expected, receivedLabel }: EnsureErrorDetails): string {
  const parts = [message];
  const extras: string[] = [];

  if (typeof expected !== "undefined" && !containsSection(message, "Expected:")) {
    extras.push(`Expected: ${formatValue(expected)}`);
  }

  if (typeof actual !== "undefined") {
    const label = receivedLabel ? `Received ${receivedLabel}` : "Received";
    if (!containsSection(message, `${label}:`)) {
      extras.push(`${label}: ${formatValue(actual)}`);
    }
  }

  if (!containsSection(message, "Matcher:")) {
    extras.push(`Matcher: ${matcher}`);
  }

  if (extras.length > 0) {
    parts.push("", ...extras);
  }

  return parts.join("\n");
}

function formatValue(value: unknown): string {
  return inspect(value, { depth: 4, maxArrayLength: 10, breakLength: 60, sorted: true });
}

function containsSection(message: string, label: string): boolean {
  return message
    .split("\n")
    .some((line) => line.trimStart().startsWith(label));
}
