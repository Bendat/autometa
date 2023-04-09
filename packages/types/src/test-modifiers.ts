export const TestModifier = {
  SKIP: "SKIP",
} as const;

export type ModifierType = keyof typeof TestModifier;
