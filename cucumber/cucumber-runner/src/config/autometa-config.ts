import { TableType } from "@gherkin/datatables/table-type";
import { TestFunctions } from "@gherkin/test-functions";
import { Class } from "@typing/class";
import { EventSubscriber } from "src/events";

export interface AutometaConfig {
  /**
   * The class reference of this projects `App`
   * type. An App is a class which is decorated
   * with the `Fixture` decorator, and the
   * `Scope` decorator with a value of `Lifecycle.ContainerScoped`.
   *
   * The class may contain references to other
   * `Fixture` decorated classes in it's constructor
   * parameter list. At the start of each test,
   * the App and its parameters will be automatically
   * created and injected.
   *
   * The app will be available as the last
   * argument in a step function callback
   *
   * ```ts
   * import { Fixture, Scope, Lifecycle } from "@autometa/cucumber-runner";
   * import { MyClient, MyRequest, MyResponse } from '../my-stuff'
   *
   * ＠Fixture
   * ＠Persistent
   * export class MyWorld {
   *    [key: string]: unknown
   *    declare myApiRequest: Request<MyRequest>;
   *    declare myApiResponse: Response<MyResponse>;
   * }
   *
   * ＠Fixture()
   * ＠Persistent
   * export class MyApp {
   *    constructor(
   *      world: MyWorld
   *      myClient: MyClient
   *    ){}
   * }
   *
   *
   * // in steps file
   *
   * Given(
   *  'a request',
   *  (table: HorizontalDatatable, { world, myClient }: MyApp) => {
   *        World.myApiRequest = myClient.createRequest(table);
   * })
   * ```
   * :::tip
   * `Persistent` means the same object will be injected
   * to all dependants, rather than a new instance for each
   * newly constructed type.
   *
   * This is useful for the World and App fixtures,
   * which store test data that may be accessed from
   * different clients or steps.
   * :::
   */
  app?: Class<unknown>;
  /**
   * Tag expression string to filter tests
   * with. Defaults to environments CUCUMBER_FILTER_TAGS
   * if it is defined,
   *
   * Example: `@web @smoke and not @mobile`
   */
  tagFilter?: string;
  /**
   * Default location to search for feature files
   * when using the features root pattern.
   *
   * ```ts
   * Features('^/my-feature.feature')
   * ```
   *
   * Which when featureRoots is `test/features`
   * resolves to `/path/to/project-root/test/features/my-feature.feature'
   */
  featuresRoot?: string;
  /**
   * Location where globally available step
   * files are located. Step files are those
   * which contain global callbaclks
   *
   * ```ts
   * import { Given } from '@autometa/cucumber'
   *
   * Given('a step', ()=>console.log('called!'))
   * ```
   *
   * Steps in this folder will automatically be
   * loaded and available for use in test files.
   */
  globalsRoot?: string;
  /**
   * Config options for handling Cucumber
   * DataTables.
   */
  dataTables?: {
    /**
     * If defined, the specified class
     * will be used as a transformer that
     * parses a Cucumber DataTable.
     *
     * Defaults to {@link HTable}
     * which treats the first row as titles,
     * and subsequent rows as columns of those
     * titles.
     */
    default?: TableType<unknown>;
  };
  /**
   * Sets the Test Runner functions to use
   * in your framework.
   *
   * For example, to enable Jest:
   *
   * ```ts
   * // this import can be ignored
   * // if jest is set globally,
   * // which is the default behavior.
   * import {
   *  describe,
   *  test,
   *  beforeEach,
   *  afterEach,
   *  beforeAll,
   *  afterAll
   * } from '@jest/globals'
   * import { defineConfig } from '@autometa/cucumber-runner'
   *
   * defineConfig({
   *  runner: {
   *    name: 'jest',
   *    describe,
   *    test,
   *    beforeEach,
   *    beforeAll,
   *    afterEach,
   *    afterAll,
   *  }
   * })
   * ```
   *
   * or in vitest:
   *
   * ```ts
   * import {
   *  describe,
   *  test,
   *  beforeEach,
   *  afterEach,
   *  beforeAll,
   *  afterAll
   * } from 'vitest'
   * import { defineConfig } from '@autometa/cucumber-runner'
   *
   * defineConfig({
   *  runner: {
   *    name: 'vitest',
   *    describe,
   *    test,
   *    beforeEach,
   *    beforeAll,
   *    afterEach,
   *    afterAll,
   *  }
   * })
   * ```
   */
  runner?: { name: string } & TestFunctions;

  /**
   * List of Class prototypes which partially implement
   * the `TestSubscriber` interface. 
   * 
   * These will be sent events at various parts of 
   * test execution, such as steps, scenarios and features.
   * 
   * They are passed information about the test, group or hook
   * about to be executed, or details about the result of the test,
   * group or hook 
   */
  subscribers?: Class<EventSubscriber>[];
}
