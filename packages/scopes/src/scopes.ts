import { StepAction } from "@autometa/gherkin";
import { FeatureScope } from "./feature-scope";
import { RuleScope } from "./rule-scope";
import { ScenarioOutlineScope } from "./scenario-outline-scope";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
import type { FeatureAction, RuleAction, ScenarioAction } from "./types";

export interface Scopes {
  Feature(filepath: string): FeatureScope;
  Feature(testDefinition: FeatureAction, filepath: string): FeatureScope;
  Feature(...args: (FeatureAction | string)[]): FeatureScope;
  Scenario(title: string, action: ScenarioAction): ScenarioScope;
  ScenarioOutline(title: string, action: ScenarioAction): ScenarioOutlineScope;
  Rule(title: string, action: RuleAction): RuleScope;
  Given(title: string, action: StepAction): StepScope;
  When(title: string, action: StepAction): StepScope;
  Then(title: string, action: StepAction): StepScope;
}
