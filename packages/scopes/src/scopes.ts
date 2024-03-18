import { DataTable, NeverDataTable, TableDocument } from "@autometa/gherkin";
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
  SizedTimeout,
} from "./types";
import { GlobalScope } from "./global-scope";
import { AfterHook, BeforeHook, SetupHook, TeardownHook } from "./hook";

export interface Scopes {
  Global: GlobalScope;
  /**
   * Executes a gherkin `.feature` file. Assembles Tests
   * using the Cucumber file and globally defined Step Definitions.
   *
   * ``ts
   * // using relative path
   * import { Feature } from '@autometa/runner'
   *
   * Feature('../features/my-feature.feature')
   * ```
   *
   * Steps will be automatically assembled from Globally defined Step Definitions,
   * if a step definition root and app root are defined.
   *
   * ```ts
   * import { defineConfig } from '@autometa/runner'
   *
   * defineConfig({
   *  ...
   *  roots: {
   *    steps: ['./test/steps'],
   *    app: ['./app'],
   *  },
   * }
   * ```
   *
   * Global steps are defined in standard Cucumber stle.
   * ```ts
   * // ./test/steps/my-steps.ts
   * import { Given, When, Then } from '@autometa/runner'
   *
   * Given('I have a step', () => {})
   * When('I do something', () => {})
   * Then('I expect something', () => {})
   * ```
   * @param filepath The absolute, relative, or 'feature root' path to the `.feature` file.
   */
  Feature(filepath: string): FeatureScope;
  /**
   * Executes a gherkin `.feature` file. Assembles Tests
   * using the Cucumber file and globally defined Step Definitions.
   * Accepts a timeout in milliseconds which will be applied to
   * all tests within the feature.
   *
   * ``ts
   * // using relative path
   * import { Feature } from '@autometa/runner'
   *  // 10 second timeout
   * Feature('../features/my-feature.feature', 10_000)
   * ```
   *
   * Steps will be automatically assembled from Globally defined Step Definitions,
   * if a step definition root and app root are defined.
   *
   * ```ts
   * import { defineConfig } from '@autometa/runner'
   *
   * defineConfig({
   *  ...
   *  roots: {
   *   steps: ['./test/steps'],
   *   app: ['./app'],
   *  },
   * }
   * ```
   *
   * Global steps are defined in standard Cucumber stle.
   *
   * ```ts
   * // ./test/steps/my-steps.ts
   * import { Given, When, Then } from '@autometa/runner'
   *
   * Given('I have a step', () => {})
   * When('I do something', () => {})
   * Then('I expect something', () => {})
   * ```
   * @param filepath The absolute, relative, or 'feature root' path to the `.feature` file.
   * @param timeout The timeout in milliseconds to apply to all tests within the feature.
   */
  Feature(filepath: string, timeout: number): FeatureScope;
  /**
   * Executes a gherkin `.feature` file. Assembles Tests
   * using the Cucumber file and globally defined Step Definitions.
   * Accepts a timeout as a `TestTimeout` which is a tuple of `[durationNumber, 'ms' | 's' | 'm' | 'h']`
   * which will be applied to all tests within the feature.
   *
   * i.e. `[10, 's']` is a 10 second timeout. `[1, 'm']` is a 1 minute timeout.
   *
   * ``ts
   * // using relative path
   * import { Feature } from '@autometa/runner'
   *
   * // 10 second timeout
   * Feature('../features/my-feature.feature', [10, 's'])
   * ```
   *
   * Steps will be automatically assembled from Globally defined Step Definitions,
   * if a step definition root and app root are defined.
   *
   * ```ts
   * import { defineConfig } from '@autometa/runner'
   *
   * defineConfig({
   *  ...
   *  roots: {
   *   steps: ['./test/steps'],
   *   app: ['./app'],
   *  },
   * };
   *
   * ```
   *
   * @param filepath
   * @param timeout
   */
  Feature(filepath: string, timeout: TestTimeout): FeatureScope;
  /**
   * Executes a gherkin `.feature` file. Assembles Tests
   * using the Cucumber file and optionally locally defined steps,
   * mixed with optionally globally defined Step Definitions.
   *
   * ```ts
   * import { Feature } from '@autometa/runner'
   *
   * Feature('My Feature', () => {
   *   Given('I have a step', () => {})
   *   When('I do something', () => {})
   *   Then('I expect something', () => {})
   * })
   * ```ts
   *
   * If defined in the Gherkin, it will also use any Globally defined Step Definitions which match,
   * if none is defined locally. If a Step Definition is defined both globally and locally,
   * the most local definition will be used. This applies to sub-scopes like Scenarios and Rules
   * also.
   *
   * ```ts
   * import { Feature } from '@autometa/runner'
   *
   * Feature('My Feature', () => {
   *  Given('I have a step', () => {})
   *  When('I do something', () => {})
   *  Then('I expect something', () => {})
   *
   *  Scenario('My Scenario', () => {
   *    Given('I have a step', () => {})
   *  })
   *
   *  Rule('My Rule', () => {
   *   Given('I have a step', () => {})
   *  })
   *
   * @param testDefinition
   * @param filepath
   */
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
  Scenario(
    ...args: (string | ScenarioAction | SizedTimeout | number)[]
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
  ScenarioOutline(
    ...args: (string | ScenarioAction | SizedTimeout | number)[]
  ): ScenarioScope;

  Rule(title: string, action: RuleAction): RuleScope;
  Rule(title: string, action: RuleAction, timeout: number): RuleScope;
  Rule(title: string, action: RuleAction, timeout: SizedTimeout): RuleScope;
  Rule(...args: (string | RuleAction | SizedTimeout | number)[]): RuleScope;

  Given<
    TText extends string,
    TTable extends DataTable | TableDocument<DataTable> = NeverDataTable
  >(
    title: TText,
    action: StepActionFn<TText, TTable>,
    tableType?: Class<TTable>
  ): void;
  When<
    TText extends string,
    TTable extends DataTable | TableDocument<DataTable> = NeverDataTable
  >(
    title: TText,
    action: StepActionFn<TText, TTable>,
    tableType?: Class<TTable>
  ): void;
  Then<
    TText extends string,
    TTable extends DataTable | TableDocument<DataTable> = NeverDataTable
  >(
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
