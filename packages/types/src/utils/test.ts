export const TestModifier = {
  SKIP: "SKIP"
} as const;

export type ModifierType = keyof typeof TestModifier;

export const Status = {
  FAILED: "FAILED",
  BROKEN: "BROKEN",
  PASSED: "PASSED",
  SKIPPED: "SKIPPED"
} as const;

export type StatusType = keyof typeof Status;
