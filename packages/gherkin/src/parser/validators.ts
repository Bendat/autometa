import {
  Background as GherkinBackground,
  FeatureChild,
  Rule as GherkinRule,
  Scenario as GherkinScenario,
} from "@cucumber/messages";

export function isRule(child: FeatureChild): child is { rule: GherkinRule } {
  return "rule" in child;
}

export function isScenarioOutline(
  child: FeatureChild
): child is { scenario: GherkinScenario } {
  if (isScenario(child)) {
    const { scenario } = child;
    if (scenario?.examples && scenario.examples.length > 0) {
      return true;
    }
  }
  return false;
}

export function isBackground(
  child: FeatureChild
): child is { background: GherkinBackground } {
  return "background" in child;
}

export function isScenario(
  child: FeatureChild
): child is { scenario: GherkinScenario } {
  return "scenario" in child;
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}
