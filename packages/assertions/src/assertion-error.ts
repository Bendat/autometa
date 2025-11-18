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
  const hasExpected = typeof expected !== "undefined";
  const hasActual = typeof actual !== "undefined";

  if (hasExpected || hasActual) {
    parts.push("");
    if (hasExpected) {
      parts.push(`Expected: ${formatValue(expected)}`);
    }
    if (hasActual) {
      const label = receivedLabel ? `Received ${receivedLabel}` : "Received";
      parts.push(`${label}: ${formatValue(actual)}`);
    }
    parts.push(`Matcher: ${matcher}`);
  }

  return parts.join("\n");
}

function formatValue(value: unknown): string {
  return inspect(value, { depth: 4, maxArrayLength: 10, breakLength: 60, sorted: true });
}
