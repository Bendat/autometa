import { DataTable, NeverDataTable } from "@autometa/gherkin";
import { Class } from "@autometa/types";
import { FeatureScope } from "./feature-scope";
import { RuleScope } from "./rule-scope";
import { ScenarioOutlineScope } from "./scenario-outline-scope";
import { ScenarioScope } from "./scenario-scope";
import type { FeatureAction, RuleAction, ScenarioAction, StepAction } from "./types";

export interface Scopes {
  Feature(filepath: string): FeatureScope;
  Feature(testDefinition: FeatureAction, filepath: string): FeatureScope;
  Feature(...args: (FeatureAction | string)[]): FeatureScope;
  Scenario(title: string, action: ScenarioAction): ScenarioScope;
  ScenarioOutline(title: string, action: ScenarioAction): ScenarioOutlineScope;
  Rule(title: string, action: RuleAction): RuleScope;
  Given<TText extends string, TTable extends DataTable = NeverDataTable>(
    title: TText,
    action: StepAction<TText, TTable>,
    tableType?: Class<TTable>
  ): void;
  When<TText extends string, TTable extends DataTable = NeverDataTable>(
    title: TText,
    action: StepAction<TText, TTable>,
    tableType?: Class<TTable>
  ): void;
  Then<TText extends string, TTable extends DataTable = NeverDataTable>(
    title: TText,
    action: StepAction<TText, TTable>,
    tableType?: Class<TTable>
  ): void;
}