import { GherkinFeature } from "@gherkin/gherkin-feature";
import { parseGherkin } from "@gherkin/parse";
import { FeatureScope } from "./feature-scope";
import { RuleScope } from "./rule-scope";
import { GlobalScope } from "./global-scope";
import { ScenarioScope } from "./scenario-scope";
import { ScenarioOutlineScope } from "./scenario-outline-scope";
import { StepScope } from "./step-scope";
import { StepAction, StepText } from "./types";
import { getFeatureFile, getRealPath } from "../filesystem/filesystem";
import { TeardownHook, AfterHook, SetupHook, BeforeHook } from "./hook";
import { glob } from "glob";
import getCallerFile from "get-caller-file";
import fs from "fs";
import fsPath from "path";
import { TableType } from "@gherkin/datatables/table-type";
import { Modifiers } from "@gherkin/types";
import { ParsedDataTable } from "@gherkin/datatables/datatable";
import { HookCache } from "@gherkin/step-cache";
export const globalScope = new GlobalScope(new HookCache());
interface IFeature {
  /**
   * Executes a .feature file or multiple .feature files.
   *
   * Performs an action which can be used to initialize
   * localized steps, scenarios, rules or hooks.
   *
   * ```ts
   * import { Feature, Before, After, Rule } from '@autometa/cucumber-runner'
   *
   * Feature(() => {
   *   After(async ({ world, myClient })=>{
   *      await myClient.cleanup(world.userIds)
   *   })
   *
   *   Rule(() => {
   *      Before(({ myClient }) => {
   *        myClient.configure('some-rule-condition', true)
   *      })
   *   })
   * }, '^/my-feature.feature')
   * ```
   *
   * If multiple feature files are provided, e.g.
   * ```ts
   * Feature(() => {
   *   ... stuff
   * }, '^/my-feature.feature', '^/my-related-feature.feature')
   * ```
   *
   * Then the callback will be executed relative to all features
   * provided.
   *
   * Scenarios and rules will be automatically generated
   * from global steps, as well as steps defined locally
   * within their respective callback.
   * @param action The action to perform for each feature
   * @param path the path or array of paths of feature to execute
   */
  (action: () => void, ...path: string[]): void;
  /**
   * Executes a list of feature files using global step functions.
   * Example (assuming all global steps are defined);
   * ```ts
   * import { Feature } from '@autometa/cucumber-runner'
   *
   * Feature('^/my-feature.feature', '^/my-other-feature')
   * ```
   * @param path a variadic list of feature file paths
   * which should be executed under this scope.
   *
   * Scenarios, Rules and Steps will be automatically assembled based
   * on global steps.
   */
  (...path: string[]): void;
  (action: string | (() => void), ...path: string[]): void;
  skip: IFeature;
  only: IFeature;
}
export const runFeature = (
  action: string | (() => void),
  modifiers?: Modifiers,
  ...path: string[]
) => {
  const args = normalizeFeatureArgs(action, ...path);
  const caller = getCallerFile(3);

  args.paths.forEach((path) => {
    const files = getActualFeatureFiles(path, caller);
    files.forEach((file) => {
      const scope = new FeatureScope(args.action, file, globalScope.hookCache, modifiers);
      globalScope.attach(scope);
      const featureFile = getFeatureFile(file);
      const ast = parseGherkin(featureFile);
      const feature = new GherkinFeature(ast, globalScope.getStepCache());

      feature.build(scope);
      feature.test();
    });
  });
};

function feature(action: StepAction, ...path: string[]) {
  return runFeature(action, undefined, ...path);
}
function onlyFeature(action: StepAction, ...path: string[]) {
  return runFeature(action, "only", ...path);
}

function skipFeature(action: StepAction, ...path: string[]) {
  return runFeature(action, "skip", ...path);
}
export const Feature: IFeature = feature as unknown as IFeature;

Reflect.defineProperty(feature, "only", {
  get: () => onlyFeature,
});

Reflect.defineProperty(feature, "skip", {
  get: () => skipFeature,
});

export function getActualFeatureFiles(path: string, caller: string) {
  const realPath = getRealPath(path, caller);
  let files = glob.sync(realPath);
  files = files.length === 0 ? [path] : files;
  const dirPath = getRealPath(path, caller);
  const dirStat = fs.lstatSync(dirPath);
  if (dirStat.isDirectory()) {
    files = [];
    fs.readdirSync(getRealPath(path, caller))
      .filter((it) => fsPath.extname(it) === ".feature")
      .forEach((file) => files.push(fsPath.resolve(dirPath, file)));
  }
  return files;
}

function normalizeFeatureArgs(
  action: string | (() => void),
  ...path: string[]
): { action: () => void; paths: string[] } {
  if (!action && (!path || path.length === 0)) {
    throw new Error(
      `A Path to a feature file must be provided. Optionally a callback to define scenarios or steps may be defined.`
    );
  }
  if (typeof action === "string") {
    return { action: () => undefined, paths: [action.replace(/\\/, "/")] };
  }
  return { action, paths: path.map((it) => it.replace(/\\/, "/")) };
}
/**
 * Must be called from inside a `Feature`. Allows
 * local steps and hooks to be executed at the rule
 * level. If steps are defined inside the rule, they will
 * be used by the test, even if a matching global step
 * has been defined.
 *
 * Similarly, hooks can be executed from within
 * the Rule and will only run in relation to
 * the scenarios within that rules.
 *
 * ```ts
 * Feature(() =>{
 *    Rule('my rule', () => {
 *      Before('rule specific beforeEach', ({ myClient })=>{
 *        myClient.initialize()
 *      })
 *    })
 * }, '^/my-feature.feature')
 * ```
 */
export function Rule(title: string, action: StepAction) {
  const scope = new RuleScope(title, action, globalScope.hookCache);
  globalScope.attach(scope);
}

// function Scenario(title: string, action: StepAction) {
//   baseScenario(title, action);
// }
function baseScenario(title: string, action: StepAction) {
  const scope = new ScenarioScope(title, action, globalScope.hookCache);
  globalScope.attach(scope);
}
function onlyScenario(title: string, action: StepAction) {
  const scope = new ScenarioScope(title, action, globalScope.hookCache, "only");
  globalScope.attach(scope);
}
function skipScenario(title: string, action: StepAction) {
  const scope = new ScenarioScope(title, action, globalScope.hookCache, "skip");
  globalScope.attach(scope);
}
Reflect.defineProperty(baseScenario, "only", {
  get: () => onlyScenario,
});
Reflect.defineProperty(baseScenario, "skip", {
  get: () => skipScenario,
});
/**
 * Must be called within `Feature` or `Rule` scope.
 * Allows local steps and hooks to be executed at the scenario
 * level, If steps are defined inside the Scenario,
 * they will be used instead of the globally
 * defined steps, or any other step defined above them (at the
 * Rule or Feature level).
 *
 * ```ts
 * Feature(() =>{
 *    Scenario('my scenario', () => {
 *      Given('scenario specific step', ({ myClient })=>{
 *        myClient.initialize()
 *      })
 *    })
 * }, '^/my-feature.feature')
 * ```
 * @param title The title of the scenario to operate on
 * @param action The function which executes any steps or callbacks inside
 * this Scenario.
 */
interface IScenario {
  /**
   * Must be called within `Feature` or `Rule` scope.
   * Allows local steps and hooks to be executed at the scenario
   * level, If steps are defined inside the Scenario,
   * they will be used instead of the globally
   * defined steps, or any other step defined above them (at the
   * Rule or Feature level).
   *
   * ```ts
   * Feature(() =>{
   *    Scenario('my scenario', () => {
   *      Given('scenario specific step', ({ myClient })=>{
   *        myClient.initialize()
   *      })
   *    })
   * }, '^/my-feature.feature')
   * ```
   * @param title The title of the scenario to operate on
   * @param action The function which executes any steps or callbacks inside
   * this Scenario.
   */
  (title: string, action: StepAction): void;
  skip: IScenario;
  only: IScenario;
}
export const Scenario = baseScenario as IScenario;
/**
 * Must be called within 'Feature' or 'Rule' scope.
 * Creates a local override of a Gherkin Scenario.
 * Steps will automaticaly be assembled from global steps,
 * but outline specific steps and hooks declared
 * inside this functions scope will override higher
 * order steps.
 * ```ts
 * Feature(() =>{
 *    ScenarioOutline('my scenario outline', () => {
 *      Teardown('cleanup to execute when outline completes', () =>
 *        ...
 *      })
 *      Given('scenario outline specific step', ({ myClient })=>{
 *        myClient.initialize()
 *      })
 *    })
 * }, '^/my-feature.feature')
 * ```
 * @param title
 * @param action
 */
export function ScenarioOutline(title: string, action: StepAction) {
  const scope = new ScenarioOutlineScope(title, action, globalScope.hookCache);
  globalScope.attach(scope);
}
/**
 * Step function to match against a Given step in one or more
 * gherkin files. If called outside of an executing test,
 * will be cached and automatically assembled into scenarios.
 *
 * If called inside a Feature, Scenario, Rule or Outline it
 * will only be accessible to tests within that group, or
 * used directly for Scenarios.
 * ```ts
 * // run before each test in this file
 * Given('a user searching for cars', () => ...)
 * Feature(() => {
 *    Given('a step unique to this feature', () => ....);
 *    Scenario('scenario with weird behavior', () => {
 *      // override the global step of the same name,
 *      // for this specific scenario. This step will
 *      // be used even if a higher order step is defined.
 *      Given('a user searching for cars', () => ...)
 *    })
 * }, '^/my-feature.feature')
 * ```
 *
 * Cucumber expressions can be used to fuzzy match and extract
 * matching values as arguments.
 *
 * ```ts
 * // matchs Given a user Johnny age 20
 * Given('a user {word} age {int}', (name: string, age: number)=>...)
 * ```
 * @param text The text, cucumber expression, or regular expression to match against a gherkin step
 * @param action The step action to execute.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Given<T extends TableType<any> = any>(
  text: StepText,
  action: StepAction,
  table?: T
) {
  const scope = new StepScope("Given", "Context", text, action, table);
  globalScope.attach(scope);
}
/**
 * Step function to match against a When step in one or more
 * gherkin files. If called outside of an executing test,
 * will be cached and automatically assembled into scenarios.
 *
 * If called inside a Feature, Scenario, Rule or Outline it
 * will only be accessible to tests within that group, or
 * used directly for Scenarios.
 * ```ts
 * // run before each test in this file
 * When('the user searches', () => ...)
 * Feature(() => {
 *    When('the user logs out', () => ....);
 *    Scenario('scenario with weird behavior', () => {
 *      // override the global step of the same name,
 *      // for this specific scenario. This step will
 *      // be used even if a higher order step is defined.
 *      When('the user searches', () => ...)
 *    })
 * }, '^/my-feature.feature')
 * ```
 *
 * Cucumber expressions can be used to fuzzy match and extract
 * matching values as arguments.
 *
 * ```ts
 * // matchs Given a user Johnny age 20
 * Given('a user {word} age {int}', (name: string, age: number)=>...)
 * ```
 * @param text The text, cucumber expression, or regular expression to match against a gherkin step
 * @param action The step action to execute.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function When<T extends TableType<any> = any>(
  text: StepText,
  action: StepAction,
  table?: T
) {
  const scope = new StepScope("When", "Action", text, action, table);
  globalScope.attach(scope);
}

/**
 * Step function to match against a Then step in one or more
 * gherkin files. If called outside of an executing test,
 * will be cached and automatically assembled into scenarios.
 *
 * If called inside a Feature, Scenario, Rule or Outline it
 * will only be accessible to tests within that group, or
 * used directly for Scenarios.
 * ```ts
 * // run before each test in this file
 * Then('the car is red', () => ...)
 * Feature(() => {
 *    Then('a step unique to this feature', () => ....);
 *    Scenario('scenario with weird behavior', () => {
 *      // override the global step of the same name,
 *      // for this specific scenario. This step will
 *      // be used even if a higher order step is defined.
 *      Then('the car is red', () => ...)
 *    })
 * }, '^/my-feature.feature')
 * ```
 *
 * Cucumber expressions can be used to fuzzy match and extract
 * matching values as arguments.
 *
 * ```ts
 * // matchs Given a user Johnny age 20
 * Then('a user {word} age {int}', (name: string, age: number)=>...)
 * ```
 * @param text The text, cucumber expression, or regular expression to match against a gherkin step
 * @param action The step action to execute.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Then<T extends ParsedDataTable = ParsedDataTable>(
  text: StepText,
  action: StepAction,
  tableType?: TableType<T>
) {
  const scope = new StepScope("Then", "Outcome", text, action, tableType);
  globalScope.attach(scope);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HookAction = (...args: any[]) => void | Promise<void>;

/**
 * Hook to execute before each proceeding tests. If declared
 * globally, will be run for all tests. If run inside a Feature,
 * Scenario Outline or Rule, it will execute before each
 * test in that grouping only.
 *
 * ```ts
 * Before(() => console.log('runs before each test'))
 * Feature(() => {
 *  Before(() => console.log('runs before each test of this feature'))
 *  ScenarioOutline('a scenario outline', () => {
 *    Before(() => console.log('runs before each example of this outline'))
 *  })
 * }, '^/my-feature.feature')
 * ```
 *
 * Hooks can be given descriptions, which will be detailed
 * when one fails.
 * @param action the callback to execute in the hook
 */
// export function Before(action: HookAction): void;
/**
 * Hook to execute before each proceeding tests. If declared
 * globally, will be run for all tests. If run inside a Feature,
 * Scenario Outline or Rule, it will execute before each
 * test in that grouping only.
 *
 * Accepts a description string, which will be used for error handling.
 *
 *
 * ```ts
 * Before('set up databases', () => console.log('runs before each test'))
 * Feature(() => {
 *  Before(
 *    'set up feature environment',
 *    () => console.log('runs before each test of this feature')
 *  )
 *  ScenarioOutline('a scenario outline', () => {
 *    Before(
 *      'prepare user for tests'
 *      () => console.log('runs before each example of this outline')
 *    )
 *  })
 * }, '^/my-feature.feature')
 * ```
 *
 * @param action the callback to execute in the hook
 */
// export function Before(description: string, action: HookAction): void;
export function Before(
  description?: string | undefined | HookAction,
  action?: HookAction | undefined,
  tagFilter?: string
): void {
  const descriptionString = typeof description === "string" ? description : undefined;
  const actionFn = typeof description === "string" ? action : description;
  if (!actionFn) {
    throw new Error("An action must be provided Before function");
  }
  const instance = new BeforeHook(descriptionString, actionFn, tagFilter);
  globalScope.attachHook(instance);
}
/**
 * Hook to execute after each proceeding tests. If declared
 * globally, will be run for all tests. If run inside a Feature,
 * Scenario Outline or Rule, it will execute after each
 * test in that grouping only.
 *
 * ```ts
 * After(() => console.log('runs after each test'))
 * Feature(() => {
 *  Ater(() => console.log('runs after each test of this feature'))
 *  ScenarioOutline('a scenario outline', () => {
 *    After(() => console.log('runs after each example of this outline'))
 *  })
 * }, '^/my-feature.feature')
 * ```
 *
 * @param action the callback to execute in the hook
 */
// export function After(action: HookAction): void;
/**
 * Hook to execute after each proceeding tests. If declared
 * globally, will be run for all tests. If run inside a Feature,
 * Scenario Outline or Rule, it will execute after each
 * test in that grouping only.
 *
 * Accepts a description string, which will be used for error handling.
 *
 *
 * ```ts
 * After('set up databases', () => console.log('runs after each test'))
 * Feature(() => {
 *  After(
 *    'set up feature environment',
 *    () => console.log('runs after each test of this feature')
 *  )
 *  ScenarioOutline('a scenario outline', () => {
 *    After(
 *      'prepare user for tests'
 *      () => console.log('runs after each example of this outline')
 *    )
 *  })
 * }, '^/my-feature.feature')
 * ```
 *
 * @param action the callback to execute in the hook
 */
// export function After(description: string, action: HookAction): void;
export function After(
  description?: string | undefined | HookAction,
  action?: HookAction | undefined,
  tagFilter?: string
): void {
  const descriptionString = typeof description === "string" ? description : undefined;
  const actionFn = typeof description === "string" ? action : description;
  if (!actionFn) {
    throw new Error("An action must be provided to After function");
  }
  const instance = new AfterHook(descriptionString, actionFn, tagFilter);
  globalScope.attachHook(instance);
}

/**
 * Hook to execute before any proceeding tests. If declared
 * globally, will be run for all tests. If run inside a Feature,
 * Scenario Outline or Rule, it will execute after each
 * test in that grouping only.
 *
 * ```ts
 * Setup(() => console.log('runs before every test'))
 * Feature(() => {
 *  Setup(() => console.log('runs before every test of this feature'))
 *  ScenarioOutline('a scenario outline', () => {
 *    Setup(() => console.log('runs before every example of this outline'))
 *  })
 * }, '^/my-feature.feature')
 * ```
 *
 * @param action the callback to execute in the hook
 */
// export function Setup(action: HookAction, ...tags: string[]): void;
/**
 * Hook to execute after each proceeding tests. If declared
 * globally, will be run for all tests. If run inside a Feature,
 * Scenario Outline or Rule, it will execute after each
 * test in that grouping only.
 *
 * Accepts a description string, which will be used for error handling.
 *
 *
 * ```ts
 * After('set up databases', () => console.log('runs after each test'))
 * Feature(() => {
 *  After(
 *    'set up feature environment',
 *    () => console.log('runs after each test of this feature')
 *  )
 *  ScenarioOutline('a scenario outline', () => {
 *    After(
 *      'prepare user for tests'
 *      () => console.log('runs after each example of this outline')
 *    )
 *  })
 * }, '^/my-feature.feature')
 * ```
 *
 * @param action the callback to execute in the hook
 */
// export function Setup(description: string, action: HookAction, ...tags: string[]): void;
export function Setup(description?: string, action?: HookAction): void {
  const descriptionString = typeof description === "string" ? description : undefined;
  const actionFn = typeof description === "string" ? action : description;
  if (!actionFn) {
    throw new Error("An action must be provided to Setup function");
  }
  const instance = new SetupHook(descriptionString, actionFn);
  globalScope.attachHook(instance);
}
type TagExpression = string;
export interface HookOptions {
  tags: TagExpression;
}
/**
 * Hook to execute after all proceeding tests have completed. If declared
 * globally, will be run for all tests. If run inside a Feature,
 * Scenario Outline or Rule, it will execute after each
 * test in that grouping only.
 *
 * ```ts
 * Teardown(() => console.log('runs after every test completes'))
 * Feature(() => {
 *  Teardown(() => console.log('runs after every test of this feature completes'))
 *  ScenarioOutline('a scenario outline', () => {
 *    Teardown(() => console.log('runs after every example of this outline completes'))
 *  })
 * }, '^/my-feature.feature')
 * ```
 *
 * @param action the callback to execute in the hook
 */
// export function Teardown(action: HookAction): void;
/**
 * Hook to execute after all proceeding tests have completed. If declared
 * globally, will be run for all tests. If run inside a Feature,
 * Scenario Outline or Rule, it will execute after each
 * test in that grouping only.
 *
 * Accepts a description string, which will be used for error handling.
 *
 *
 * ```ts
 * Teardown('set up databases', () => console.log('runs after every test has completed'))
 * Feature(() => {
 *  Teardown(
 *    'set up feature environment',
 *    () => console.log('runs after every test of this feature of this feature completes')
 *  )
 *  ScenarioOutline('a scenario outline', () => {
 *    Teardown(
 *      'prepare user for tests'
 *      () => console.log('runs after every example of this outline completes')
 *    )
 *  })
 * }, '^/my-feature.feature')
 * ```
 *
 * @param action the callback to execute in the hook
 */
// export function Teardown(description: string, action: HookAction): void;
export function Teardown(description?: string, action?: HookAction): void {
  const descriptionString = typeof description === "string" ? description : undefined;
  const actionFn = typeof description === "string" ? action : description;
  if (!actionFn) {
    throw new Error("An action must be provided to Teardown function");
  }
  const instance = new TeardownHook(descriptionString, actionFn);
  globalScope.attachHook(instance);
}

/**
 * Used to pass configuration options to a scope
 *
 */
export function Options() {
  throw new Error("Not Implemented");
}

export function Pass() {
  // do nothing
}

export function Pending() {
  throw new Error("Pending not implemented yet");
  // do nothing
}
