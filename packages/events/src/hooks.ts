import {
  SimplePickle,
  SimplePickleFeatureRef,
  SimplePickleRuleRef,
  SimplePickleScenarioRef,
  SimplePickleStep,
  SimpleScenarioOutline,
  SimpleExampleGroup,
  SimpleScenario,
} from "@autometa/gherkin";

/** Canonical hook kinds recognised by the Autometa runner. */
export const HookKind = {
  BEFORE_FEATURE: "beforeFeature",
  AFTER_FEATURE: "afterFeature",
  BEFORE_RULE: "beforeRule",
  AFTER_RULE: "afterRule",
  BEFORE_SCENARIO: "beforeScenario",
  AFTER_SCENARIO: "afterScenario",
  BEFORE_SCENARIO_OUTLINE: "beforeScenarioOutline",
  AFTER_SCENARIO_OUTLINE: "afterScenarioOutline",
  BEFORE_EXAMPLE: "beforeExample",
  AFTER_EXAMPLE: "afterExample",
  BEFORE_BACKGROUND: "beforeBackground",
  AFTER_BACKGROUND: "afterBackground",
  BEFORE_STEP: "beforeStep",
  AFTER_STEP: "afterStep",
  SETUP: "setup",
  TEARDOWN: "teardown",
  CUSTOM: "custom",
} as const;

export type HookKind = (typeof HookKind)[keyof typeof HookKind];

export interface HookDescriptor {
  /** Categorises when the hook is executed. */
  kind: HookKind;
  /** Optional human friendly name for diagnostics. */
  name?: string;
  /** Path or identifier that produced the hook for richer reporting. */
  source?: string;
  /** Stage-specific context for the hook, when available. */
  feature?: SimplePickleFeatureRef;
  rule?: SimplePickleRuleRef;
  scenario?: SimplePickleScenarioRef;
  scenarioOutline?: SimpleScenarioOutline;
  example?: SimpleExampleGroup;
  background?: SimpleScenario;
  step?: SimplePickleStep;
  pickle?: SimplePickle;
  /** Arbitrary metadata emitted by the hook author. */
  metadata?: Record<string, unknown>;
}
