export const STEP_TYPE = {
  Context: "Context",
  Action: "Action",
  Outcome: "Outcome",
  Conjunction: "Conjunction",
  Unknown: "Unknown",
} as const;

export type StepType = keyof typeof STEP_TYPE;

export const STEP_KEYWORD = {
  Given: "Given",
  When: "When",
  Then: "Then",
  And: "And",
  But: "But",
} as const;

export type StepKeyword = keyof typeof STEP_KEYWORD;
