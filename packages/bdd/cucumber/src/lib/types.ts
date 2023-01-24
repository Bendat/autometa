import { Store, World } from '@autometa/store';
import { GherkinTable } from '@autometa/shared-utilities';

export type StepCallbackProvider = (
  text: string | RegExp,
  callback: PreparedStepCallback
) => void;
// export type ExtendedStepCallbackProvider = StepCallbackProvider & {
//   global: { isGlobal: boolean } & ((
//     text: string | RegExp,
//     callback: PreparedStepCallback
//   ) => void);
//   isGlobal: boolean;
// };
export interface ExtendedStepCallbackProvider {
  (text: string | RegExp, callback: PreparedStepCallback): void;
  global: ExtendedStepCallbackProvider;
  pending: ExtendedStepCallbackProvider;
  isGlobal: boolean;
  isPending: boolean;
}
export type PreparedStepCallback = (
  ...args: (
    | string
    | GherkinTable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | any
  )[]
) => void | Promise<void>;

export interface PreparedStepData {
  text?: string;
  regex: RegExp | undefined;
  action: PreparedStepCallback;
  isGlobal: boolean;
}

interface NamedStepGroup {
  __keyword__: string;
}
interface StepGroupData {
  [text: string]: StepData;
}

export type PreparedStepGroup = NamedStepGroup & StepGroupData;

export interface PreparedSteps {
  [key: string]: PreparedStepGroup;
  Given: PreparedStepGroup;
  When: PreparedStepGroup;
  Then: PreparedStepGroup;
  And: PreparedStepGroup;
  But: PreparedStepGroup;
}

export class StepData implements PreparedStepData {
  constructor(
    public text: string,
    public regex: RegExp | undefined,
    public action: PreparedStepCallback,
    public isGlobal: boolean
  ) {}
}

export class ScenarioSteps implements PreparedSteps {
  [key: string]: PreparedStepGroup;
  Given = attachName('Given');
  When = attachName('When');
  Then = attachName('Then');
  And = attachName('And');
  But = attachName('But');
}

function attachName(name: string): PreparedStepGroup {
  return { __keyword__: name } as unknown as PreparedStepGroup;
}

export interface StepFunctions {
  Given: ExtendedStepCallbackProvider;
  When: ExtendedStepCallbackProvider;
  Then: ExtendedStepCallbackProvider;
  And: ExtendedStepCallbackProvider;
  But: ExtendedStepCallbackProvider;
  Shared: (...steps: Steps[]) => void;
}
/**
 * A interface for a function which provides provides a group of
 * step definition functions which can be used to map your test
 * code to a gherkin file.
 *
 * Typically this will be defined as an argument to `Scenario()`
 * but can be declared outside as reusable collection of steps.
 * These can also be passed directly to the `Scenario` or
 * they can be utilized by the `Share()` function to create
 * reusable test components
 *
 * Scenario Example:
 * ```
 * Feature(({ Scenario })=>{
 *  //          v---- Steps callback
 *  Scenario(({Given, When })=>{
 *    Given('something', ()=>{
 *     ...
 *    });
 *  });
 * });
 * ```
 *
 * Shared Example:
 *
 * ```
 * const steps: Steps = (({Given}))=>{
 *    Given('something', ()=>{
 *     ...
 *    });
 * });
 *
 * Feature(({ Scenario })=>{
 *  //          v---- Steps callback
 *  Scenario(({Shared})=>{
 *    Shared(steps);
 *  })
 * });
 * ```
 */
export interface Steps {
  (callbacks: StepFunctions, data: DataStoreArgument): void | Promise<void>;
}

/**
 * Callback argument which provides methods for storing data
 * between steps, including shared steps.
 *
 * *World* is a simple cache object with key:value pairs
 * Example:
 * ```
 * Scenario('a scenario', ({Given, Then}, {World})=>{
 *  Given('a step', ()=>{
 *    World.foo = 5;
 *  });
 *  Then('foo is 5', ()=>{
 *    expect(World.foo).toBe(5)
 *  })
 * })
 * ```
 *
 * *Store* is a storage object which can store and retrieve values.
 *
 * Example:
 * ```
 * Scenario('a scenario', ({Given, Then}, {Store})=>{
 *  Given('a step', ()=>{
 *    Store.put('foo', 5);
 *  });
 *
 *  Then('foo is 5', ()=>{
 *    const foo = Store.read<number>('foo', 6);
 *    expect(foo).toBe(5)
 *  })
 * })
 * ```
 *
 * Store methods provide logging and warnings about null or undefined values.
 */
export interface DataStoreArgument {
  World: World;
  Store: Store;
}

export type ScenarioCallback = (
  title: string,
  steps: Steps
) => void | Promise<void>;

/**
 * Describes the Step Functions objects for a Background
 */
export type BackgroundCallbackObject = StepFunctions;

export type BackgroundInnerCallback = (
  callbacks: BackgroundCallbackObject
) => void | Promise<void>;

export type BackgroundCallback = (
  title: string | undefined | Steps,
  callbacks?: Steps
) => void | Promise<void>;

/**
 * A callback argument which provides the test groups like Scenario.
 * Can be executed to access the Step Definition functions
 *
 * Example:
 * ```
 * // Bad
 * Feature((tests)=>{
 *  const { Scenario } = test
 *  Scenario((steps)=>{
 *      const {Given, When, Then} = steps
 *   })
 *   // or
 *   tests.Scenario('', (steps)=>{})
 * })
 * // Better
 * Feature(({ Scenario })=>{
 *  Scenario(({Given, When, Then})=>{
 *
 *  })
 * })
 *
 * ```
 */
export interface CategoryCallbackObject {
  /**
   * Defines a scenario when called. The scenario is loaded
   * and validated, while its step definition are processed
   * into a jest test.
   *
   * The step definition functions are provided as arguments
   * to the Scenario callback.
   * Example:
   * ```
   * Scenario('a scenario', ({ Given, When })=>{
   *    Given('a given step', ()=>{});
   *    When('a when step', ()=>{});
   * })
   * ```
   */
  Scenario: ScenarioCallback;
  /**
   * Similar to scenario but will repeat execution for
   * every row of Examples in the outline.
   *
   * The step definition functions are provided as arguments
   * to the Scenario callback.
   *
   * Cucumber Expressions or Regex can be used to extract
   * Examples variables from a step.
   *
   * Example:
   * ```
   * ScenarioOutline('a scenario outline', ({ Given, When })=>{
   *    Given('a {word} dog', (color)=>{
   *      expect(color).toBe('brown')
   *    });
   *    When('it eats {int} steaks', (count)=>{
   *       expect(count).toBe(3)
   *    });
   * })
   * // For:
   * // ScenarioOutline: a scenario outline
   * //   Given a <color> dog
   * //   When it eats <count> steaks
   * //
   * //   Examples:
   * //    | color | count |
   * //    | brown |   1   |
   * ```
   */
  ScenarioOutline: ScenarioCallback;
  /**
   * Stores steps to be executed before each test in scope.
   * Steps defined here do not need to exist in the actual
   * gherkin feature file background, as long as they apply
   * to all tests in scope of the background.
   *
   * Multiple background calls are allowed and will be grouped
   * together within scope. A background can have a name but it's optional.
   *
   * Example:
   * ```
   * Background('A Named Background', ({ Given, When }) => {
   *  Given('a holly', () => {
   *   expect(1).toBe(1);
   *  });
   *  Given('a jolly', () => {
   *   expect(1).toBe(1);
   *  });
   *  When('a Christmas', () => {
   *   expect(1).toBe(1);
   *  });
   * });
   *
   * // nameless
   *
   * Background(({ Given }) => {
   *  Given('a holly', () => {
   *   expect(1).toBe(1);
   *  });
   * });
   * ```
   */
  Background: BackgroundCallback;
}

export type RuleCallback = (
  title: string,
  actions: (obj: CategoryCallbackObject) => void
) => void;

export type RuleInnerCallback = (callbacks: CategoryCallbackObject) => void;

/**
 * Test functions specific to the Feature function, provided as
 * an argument to the user defined callback.
 *
 * - All - Accepts a collection of steps and assembles scenarios automatically
 * - Rule - Accepts a rule name and a CategoryCallbackObject which acts like a lower scoped Feature
 */
export interface FeatureCallbackObject extends CategoryCallbackObject {
  All: (...steps: Steps[]) => void;
  Rule: RuleCallback;
}

export type FeatureCallback = (callbacks: FeatureCallbackObject) => void;
