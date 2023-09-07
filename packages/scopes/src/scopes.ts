import { DataTable, NeverDataTable } from "@autometa/gherkin";
import { Class } from "@autometa/types";
import { FeatureScope } from "./feature-scope";
import { RuleScope } from "./rule-scope";
import { ScenarioScope } from "./scenario-scope";
import type {
  FeatureAction,
  HookAction,
  RuleAction,
  ScenarioAction,
  StepActionFn,
  TestTimeout,
  SizedTimeout
} from "./types";
import { GlobalScope } from "./global-scope";
import { AfterHook, BeforeHook, SetupHook, TeardownHook } from "./hook";

export interface Scopes {
  Global: GlobalScope;

  Feature(filepath: string): FeatureScope;
  Feature(filepath: string, timeout: number): FeatureScope;
  Feature(filepath: string, timeout: TestTimeout): FeatureScope;
  Feature(testDefinition: FeatureAction, filepath: string): FeatureScope;
  Feature(
    testDefinition: FeatureAction,
    filepath: string,
    timeout: number
  ): FeatureScope;
  Feature(
    testDefinition: FeatureAction,
    filepath: string,
    timeout: SizedTimeout
  ): FeatureScope;
  Feature(...args: (FeatureAction | string | TestTimeout)[]): FeatureScope;

  Scenario(title: string, action: ScenarioAction): ScenarioScope;
  Scenario(
    title: string,
    action: ScenarioAction,
    timeout: number
  ): ScenarioScope;
  Scenario(
    title: string,
    action: ScenarioAction,
    timeout: SizedTimeout
  ): ScenarioScope;

  ScenarioOutline(title: string, action: ScenarioAction): ScenarioScope;
  ScenarioOutline(
    title: string,
    action: ScenarioAction,
    timeout: number
  ): ScenarioScope;
  ScenarioOutline(
    title: string,
    action: ScenarioAction,
    timeout: SizedTimeout
  ): ScenarioScope;

  Rule(title: string, action: RuleAction): RuleScope;
  Rule(title: string, action: RuleAction, timeout: number): RuleScope;
  Rule(title: string, action: RuleAction, timeout: SizedTimeout): RuleScope;

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

  Before(description: string, action: HookAction): BeforeHook;
  Before(description: string, action: HookAction, timeout: number): BeforeHook;
  Before(
    description: string,
    action: HookAction,
    tagFilterExpression: string
  ): BeforeHook;
  Before(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: number
  ): BeforeHook;
  Before(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: SizedTimeout
  ): BeforeHook;
  Before(
    description: string,
    action: HookAction,
    timeout: SizedTimeout
  ): BeforeHook;
  Before(
    description: string,
    action: HookAction,
    exprOrTimeout?: string | TestTimeout,
    timeout?: TestTimeout
  ): BeforeHook;
  After(description: string, action: HookAction): AfterHook;
  After(description: string, action: HookAction, timeout: number): AfterHook;
  After(
    description: string,
    action: HookAction,
    tagFilterExpression: string
  ): AfterHook;
  After(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: number
  ): AfterHook;
  After(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: SizedTimeout
  ): AfterHook;
  After(
    description: string,
    action: HookAction,
    timeout: SizedTimeout
  ): AfterHook;
  After(
    description: string,
    action: HookAction,
    exprOrTimeout?: string | TestTimeout,
    timeout?: TestTimeout
  ): AfterHook;
  Setup(description: string, action: HookAction): SetupHook;
  Setup(description: string, action: HookAction, timeout: number): SetupHook;
  Setup(
    description: string,
    action: HookAction,
    tagFilterExpression: string
  ): SetupHook;
  Setup(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: number
  ): SetupHook;
  Setup(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: SizedTimeout
  ): SetupHook;
  Setup(
    description: string,
    action: HookAction,
    timeout: SizedTimeout
  ): SetupHook;
  Teardown(description: string, action: HookAction): TeardownHook;
  Teardown(
    description: string,
    action: HookAction,
    timeout: number
  ): TeardownHook;
  Teardown(
    description: string,
    action: HookAction,
    tagFilterExpression: string
  ): TeardownHook;
  Teardown(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: number
  ): TeardownHook;
  Teardown(
    description: string,
    action: HookAction,
    tagFilterExpression: string,
    timeout: SizedTimeout
  ): TeardownHook;
  Teardown(
    description: string,
    action: HookAction,
    timeout: SizedTimeout
  ): TeardownHook;
}
