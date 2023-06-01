import { DataTable, Feature, GherkinNode, Rule, Scenario, Step } from "@autometa/gherkin";
import { FeatureScope, RuleScope, ScenarioScope, Scope, StepScope } from "@autometa/scopes";
export abstract class JestCucumberBridge {
  abstract data: { gherkin: GherkinNode; scope: Scope };
}
export class FeatureBridge extends JestCucumberBridge {
  data: { gherkin: Feature; scope: FeatureScope };
  scenarios: ScenarioBridge[] = [];
  rules: RuleBridge[] = [];
  steps: StepBridge[] = [];
}
export class RuleBridge extends JestCucumberBridge {
  data: { gherkin: Rule; scope: RuleScope };
  scenarios: ScenarioBridge[] = [];
  steps: StepBridge[] = [];
}
export class ScenarioBridge extends JestCucumberBridge {
  data: { gherkin: Scenario; scope: ScenarioScope };
  steps: StepBridge[] = [];
}

export class StepBridge extends JestCucumberBridge {
  data: { gherkin: Step; scope: StepScope<string, DataTable> };
}
