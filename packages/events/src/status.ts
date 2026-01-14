/**
 * Standardised execution statuses for Autometa test lifecycle events.
 */
export const TestStatus = {
  IDLE: "idle",
  RUNNING: "running",
  PASSED: "passed",
  FAILED: "failed",
  SKIPPED: "skipped",
  BROKEN: "broken",
} as const;

export type TestStatus = (typeof TestStatus)[keyof typeof TestStatus];

/** True when the status represents the end of a lifecycle transition. */
export function isTerminalStatus(status: TestStatus): boolean {
  return (
    status === TestStatus.PASSED ||
    status === TestStatus.FAILED ||
    status === TestStatus.SKIPPED ||
    status === TestStatus.BROKEN
  );
}
