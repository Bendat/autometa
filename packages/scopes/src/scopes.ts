import { DataTable, NeverDataTable } from "@autometa/gherkin";
import { Class } from "@autometa/types";
import { FeatureScope } from "./feature-scope";
import { RuleScope } from "./rule-scope";
import { ScenarioOutlineScope } from "./scenario-outline-scope";
import { ScenarioScope } from "./scenario-scope";
import type {
  FeatureAction,
  HookAction,
  RuleAction,
  ScenarioAction,
  StepActionFn
} from "./types";
import { GlobalScope } from "./global-scope";

export interface Scopes {
  Global: GlobalScope;
  Feature(filepath: string): FeatureScope;
  Feature(testDefinition: FeatureAction, filepath: string): FeatureScope;
  Feature(...args: (FeatureAction | string)[]): FeatureScope;
  Scenario(title: string, action: ScenarioAction): ScenarioScope;
  ScenarioOutline(title: string, action: ScenarioAction): ScenarioOutlineScope;
  Rule(title: string, action: RuleAction): RuleScope;
  Given<TText extends string, TTable extends DataTable = NeverDataTable>(
    title: TText,
    action: StepActionFn<TText, TTable>,
    tableType?: Class<TTable>
  ): void;
  When<TText extends string, TTable extends DataTable = NeverDataTable>(
    title: TText,
    action: StepActionFn<TText, TTable>,
    tableType?: Class<TTable>
  ): void;
  Then<TText extends string, TTable extends DataTable = NeverDataTable>(
    title: TText,
    action: StepActionFn<TText, TTable>,
    tableType?: Class<TTable>
  ): void;
  Before(
    description: string,
    action: HookAction,
    tagFilterExpression?: string
  ): void;
  After(
    description: string,
    action: HookAction,
    tagFilterExpression?: string
  ): void;
  Setup(
    description: string,
    action: HookAction,
    tagFilterExpression?: string
  ): void;
  Teardown(
    description: string,
    action: HookAction,
    tagFilterExpression?: string
  ): void;
}
