import {
  Background,
  Examples,
  Feature,
  GherkinNode,
  Rule,
  Scenario,
  ScenarioOutline,
  Step
} from "@autometa/gherkin";
import { StepTableArg } from "@autometa/scopes";
import { BackgroundScope } from "@autometa/scopes";
import {
  FeatureScope,
  RuleScope,
  ScenarioOutlineScope,
  ScenarioScope,
  Scope,
  StepScope
} from "@autometa/scopes";

export abstract class GherkinCodeBridge {
  abstract data: { gherkin: GherkinNode; scope: Scope };
}
export class FeatureBridge extends GherkinCodeBridge {
  data: { gherkin: Feature; scope: FeatureScope };
  background: BackgroundBridge;
  scenarios: (ScenarioBridge | ScenarioOutlineBridge)[] = [];
  rules: RuleBridge[] = [];
  steps: StepBridge[] = [];
}
export class BackgroundBridge extends GherkinCodeBridge {
  data: { gherkin: Background; scope: BackgroundScope };
  steps: StepBridge[] = [];
}

export class RuleBridge extends GherkinCodeBridge {
  data: { gherkin: Rule; scope: RuleScope };
  background: BackgroundBridge;
  scenarios: (ScenarioBridge | ScenarioOutlineBridge)[] = [];
  steps: StepBridge[] = [];
}

export class ScenarioBridge extends GherkinCodeBridge {
  data: { gherkin: Scenario; scope: ScenarioScope };
  steps: StepBridge[] = [];
}

export class ScenarioOutlineBridge extends GherkinCodeBridge {
  data: { gherkin: ScenarioOutline; scope: ScenarioOutlineScope };
  examples: ExamplesBridge[] = [];
  steps: StepBridge[] = [];
}

export class ExamplesBridge extends GherkinCodeBridge {
  data: { gherkin: Examples; scope: ScenarioOutlineScope };
  scenarios: ScenarioBridge[] = [];
  steps: StepBridge[] = [];
}

export class StepBridge extends GherkinCodeBridge {
  data: {
    gherkin: Step;
    scope: StepScope<string, StepTableArg | undefined>;
    args: unknown[];
  };
}
