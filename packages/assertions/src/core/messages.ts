import { diff } from "jest-diff";
import { printExpected, printReceived } from "jest-matcher-utils";

import { MATCHER_CALL } from "./constants";

export interface FailureMessageOptions {
  readonly expected?: unknown;
  readonly actual?: unknown;
  readonly diff?: string | undefined;
  readonly extra?: readonly (string | undefined)[];
}

export function buildFailureMessage(
  matcher: string,
  baseMessage: string,
  options: FailureMessageOptions = {}
): string {
  const sections: string[] = [`${MATCHER_CALL}.${matcher}(expected)`, baseMessage];

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

export function formatDiff(expected: unknown, actual: unknown): string | undefined {
  const difference = diff(expected, actual, { expand: false });
  return difference && difference.trim().length > 0 ? difference : undefined;
}

export function formatMissingList(title: string, values: readonly unknown[]): string {
  if (values.length === 0) {
    return "";
  }
  const items = values.map((value) => `  - ${printExpected(value)}`).join("\n");
  return `${title}\n${items}`;
}
