import type {
  FeatureAction,
  FeatureScope,
  ScenarioAction,
  ScenarioScope,
  SizedTimeout,
  TestTimeout
} from "@autometa/scopes";

export { defineConfig } from "./config";
export { defineParameterType } from "./parameters";
import {
  Feature as FeatureDefinition,
  Scenario as ScenarioDefinition,
  ScenarioOutline as ScenarioOutlineDefinition,
  Rule as RuleDefinition,
  Given as GivenDefinition,
  When as WhenDefinition,
  Then as ThenDefinition,
  Before as BeforeDefinition,
  After as AfterDefinition,
  Teardown as TeardownDefinition,
  Setup as SetupDefinition
} from "./scopes";
import { RuleAction } from "@autometa/scopes";
import { RuleScope } from "@autometa/scopes";
export { Pass } from "./scopes";
export * from "@autometa/phrases";
export {
  AppType,
  Fixture,
  Container,
  Constructor,
  AutometaApp,
  getApp,
  AutometaWorld,
  App,
  World,
  INJECTION_SCOPE,
  InjectionScope,
  Inject
} from "./app";
export { Dates, Time } from "@autometa/datetime";
export { AutomationError, raise } from "@autometa/errors";
export { DataTable, HTable, VTable, MTable } from "@autometa/gherkin";
export { Bind } from "@autometa/bind-decorator";
export { Types } from "@autometa/scopes";
export * from "./events";
export * from "@autometa/http";
export * from "@autometa/asserters";
export {
  GetAccessedCount,
  GetAssignedValues,
  TrackAccess
} from "@autometa/fixture-proxies";

export { FileObject } from "@autometa/file-proxies";
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
export function Feature(filepath: string): FeatureScope;
/**
 * Executes a gherkin `.feature` file. Assembles Tests
 * using the Cucumber file and globally defined Step Definitions.
 * Accepts a timeout in milliseconds which will be applied to
 * all tests within the feature.
 *
 * ```ts
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
 * Global steps are defined in standard Cucumber style.
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
export function Feature(filepath: string, timeout: number): FeatureScope;
/**
 * Executes a gherkin `.feature` file. Assembles Tests
 * using the Cucumber file and globally defined Step Definitions.
 * Accepts a timeout as a `TestTimeout` which is a tuple of `[durationNumber, 'ms' | 's' | 'm' | 'h']`
 * which will be applied to all tests within the feature.
 *
 * i.e. `[10, 's']` is a 10 second timeout. `[1, 'm']` is a 1 minute timeout.
 *
 * ```ts
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
export function Feature(filepath: string, timeout: TestTimeout): FeatureScope;
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
 * ```
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
export function Feature(
  testDefinition: FeatureAction,
  filepath: string
): FeatureScope;
/**
 * Executes a gherkin `.feature` file. Assembles Tests
 * using the Cucumber file and optionally locally defined steps,
 * mixed with optionally globally defined Step Definitions.
 * Accepts a timeout in milliseconds which will be applied to
 * all tests within the feature.
 *
 * ```ts
 * import { Feature } from '@autometa/runner'
 *
 * // 10 second timeout
 * Feature('My Feature', () => {
 *  Given('I have a step', () => {})
 *  When('I do something', () => {})
 *  Then('I expect something', () => {})
 * }, 10_000)
 * ```
 * @param testDefinition the Feature definition callback
 * @param filepath
 * @param timeout
 */
export function Feature(
  testDefinition: FeatureAction,
  filepath: string,
  timeout: number
): FeatureScope;
export function Feature(
  ...args: (FeatureAction | string | TestTimeout)[]
): FeatureScope {
  return FeatureDefinition(...args);
}

export function Scenario(title: string, action: ScenarioAction): ScenarioScope;
export function Scenario(
  title: string,
  action: ScenarioAction,
  timeout: number
): ScenarioScope;
export function Scenario(
  title: string,
  action: ScenarioAction,
  timeout: SizedTimeout
): ScenarioScope;
export function Scenario(
  ...args: (string | ScenarioAction | SizedTimeout | number)[]
): ScenarioScope {
  return ScenarioDefinition(...args);
}

export function ScenarioOutline(
  title: string,
  action: ScenarioAction
): ScenarioScope;
export function ScenarioOutline(
  title: string,
  action: ScenarioAction,
  timeout: number
): ScenarioScope;
export function ScenarioOutline(
  title: string,
  action: ScenarioAction,
  timeout: SizedTimeout
): ScenarioScope;
export function ScenarioOutline(
  ...args: (string | ScenarioAction | SizedTimeout | number)[]
): ScenarioScope {
  return ScenarioOutlineDefinition(...args);
}

export function Rule(title: string, action: RuleAction): RuleScope;
export function Rule(
  title: string,
  action: RuleAction,
  timeout: number
): RuleScope;
export function Rule(
  title: string,
  action: RuleAction,
  timeout: SizedTimeout
): RuleScope;
export function Rule(
  ...args: (string | RuleAction | SizedTimeout | number)[]
): RuleScope {
  return RuleDefinition(...args);
}
/**
 * Defines a `Given` step definition. Matches a gherkin step
 * as either a string literal match, or a Cucumber Expression.
 *
 * The callback function is passed as it's last (or only) argument
 * a copy of the `App` object which also contains a reference to the World.
 * This can be used to access features, or store data across steps within a test.
 *
 * N.b. The App instance is shared between all step definitions and hooks within
 * the context of a scenario, but cannot be accessed from the same step in a different
 * scenario.
 *
 * ```ts
 * import { Given } from '@autometa/runner'
 *
 * Given('I have a step', (app) => {
 *  app.world.someData = 'some value'
 * })
 * // using destructuring
 * Given('I have a step', ({ world }) => {
 *  world.someData = 'some value'
 * })
 * ```
 *
 * Steps also support Cucumber Expressions, which can be used to match
 * dynamic values in the step.
 *
 * ```ts
 * import { Given } from '@autometa/runner'
 *
 * // matches 'Given I have a step with a 'blue' value'
 * Given('I have a step with a {string} value', (value, { world }) => {
 *  world.someData = value
 * })
 *
 * @param pattern The step pattern to match.
 * @param action The step action to execute.
 */
export const Given = GivenDefinition;
/**
 * Defines a `When` step definition. Matches a gherkin step
 * as either a string literal match, or a Cucumber Expression.
 *
 * The callback function is passed as it's last (or only) argument
 * a copy of the `App` object which also contains a reference to the World.
 * This can be used to access features, or store data across steps within a test.
 *
 * N.b. The App instance is shared between all step definitions and hooks within
 *
 * ```ts
 * import { When } from '@autometa/runner'
 *
 * When('I do something', async (app) => {
 *   await app.webdriver.click('#some-button')
 * })
 *
 * // using destructuring
 * When('I do something', async ({ webdriver }) => {
 *  await webdriver.click('#some-button')
 * })
 * ```
 *
 * Steps also support Cucumber Expressions, which can be used to match
 * dynamic values in the step.
 *
 * ```ts
 * import { When } from '@autometa/runner'
 *
 * // matches 'When I do something with a 'blue' value'
 * When('I do something with a {string} value', async (value, { webdriver }) => {
 *   await webdriver.click(`#some-button-${value}`)
 * })
 *
 * @param pattern The step pattern to match.
 * @param action The step action to execute.
 */
export const When = WhenDefinition;

/**
 * Defines a `Then` step definition. Matches a gherkin step
 * as either a string literal match, or a Cucumber Expression.
 *
 * The callback function is passed as it's last (or only) argument
 * a copy of the `App` object which also contains a reference to the World.
 * This can be used to access features, or store data across steps within a test.
 *
 * N.b. The App instance is shared between all step definitions and hooks within
 *
 * ```ts
 * import { Then } from '@autometa/runner'
 *
 * Then('I expect something', async (app) => {
 *   await app.webdriver.click('#some-button')
 * })
 *
 * // using destructuring
 * Then('I expect something', async ({ webdriver }) => {
 *  await webdriver.click('#some-button')
 * })
 * ```
 *
 * Steps also support Cucumber Expressions, which can be used to match
 * dynamic values in the step.
 *
 * ```ts
 * import { Then } from '@autometa/runner'
 *
 * // matches 'Then I expect something with a 'blue' value'
 * Then('I expect something with a {string} value', async (value, { world }) => {
 *   expect(world.someData).toBe(value)
 * })
 *
 * @param pattern The step pattern to match.
 * @param action The step action to execute.
 */
export const Then = ThenDefinition;

/**
 * Defines a `Before` hook. Executes before each scenario.
 *
 * ```ts
 * import { Before } from '@autometa/runner'
 *
 * Before(async (app) => {
 *   await app.webdriver.click('#some-button')
 * })
 *
 * // using destructuring
 * Before(async ({ webdriver }) => {
 *  await webdriver.click('#some-button')
 * })
 * ```
 *
 * @param action The hook action to execute.
 */
export const Before = BeforeDefinition;

/**
 * Defines a `After` hook. Executes after each scenario.
 *
 * ```ts
 * import { After } from '@autometa/runner'
 *
 * After(async (app) => {
 *   await app.webdriver.click('#some-button')
 * })
 *
 * // using destructuring
 * After(async ({ webdriver }) => {
 *  await webdriver.click('#some-button')
 * })
 * ```
 *
 * @param action The hook action to execute.
 */
export const After = AfterDefinition;

/**
 * Defines a `Setup` hook. Executes before all scenarios.
 * Setups are scoped, meaning a Setup defined inside the scope of a rule
 * will only apply to scenarios within that rule.
 *
 * N.b the Setup Hook and Teardown Hook reference their own unique
 * copy of the App with it's own unique life cycle. Values stored here
 * will not be accessible in tests without a singleton fixture.
 *
 * ```ts
 * import { Setup } from '@autometa/runner'
 *
 * Setup(async (app) => {
 *   await app.webdriver.click('#some-button')
 * })
 *
 * // using destructuring
 * Setup(async ({ webdriver }) => {
 *  await webdriver.click('#some-button')
 * })
 * ```
 *
 * @param action The hook action to execute.
 */
export const Teardown = TeardownDefinition;

/**
 * Defines a `Teardown` hook. Executes after all scenarios have completed.
 * Teardowns are scoped, meaning a Teardown defined inside the scope of a rule
 * will only apply to scenarios within that rule.
 *
 * N.b the Setup Hook and Teardown Hook reference their own unique
 * copy of the App with it's own unique life cycle. Values stored here
 * will not be accessible in tests without a singleston fixture.
 * ```ts
 * import { Teardown } from '@autometa/runner'
 *
 * Teardown(async (app) => {
 *   await app.webdriver.click('#some-button')
 * })
 *
 * // using destructuring
 * Teardown(async ({ webdriver }) => {
 *  await webdriver.click('#some-button')
 * })
 * ```
 *
 * @param action The hook action to execute.
 */
export const Setup = SetupDefinition;
