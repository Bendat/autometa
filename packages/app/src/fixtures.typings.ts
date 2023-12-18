/* eslint-disable @typescript-eslint/no-empty-interface */

import { Container } from "@autometa/injection";

/**
 * Basic Key Value store for managing state across Step Definitions. A unique copy of this object
 * is shared between all steps and hooks in a given running Scenario, however it is not possible
 * to interact with state outside of that Scenarios life cycle. That is to say, while the World
 * is shared between steps, it is unique across tests.
 * 
 * To extend the worlds vocabulary, you can declare properties on the World. These do not need
 * to be defined at run time. Instead they will be filled in as they are produced by steps.
 * 
 * To declare World properties, you can simply declare an uninitialized property. Depending
 * on your `tsconfig.json` settings you can do so with one of the three following syntaxes:
 * 
 * ```typescript
 * @Fixture
 * export class World {
 *  [key: string]: unknown;
 *  
 *  declare foo: number
 * 
 *  foo: number
 * 
 *  foo!: number
 * }
 * 
 * The World is automatically injected into the {@link App} object, and can be accessed via
 * the last (or only) argument of a step definition callback.
 * 
 * ```ts
 * Given('I have {int} cats', (cats: number, app: App) => {
 *    app.world.cats = cats
 * })
 * 
 * // using destructuring
 * Given('I have {int} cats', ({world}: App) => {
 *   world.cats = cats
 * })
 * ```
 */
export interface World {
  [key: string]: unknown;
}

/**
 * The App object is the primary interface for interacting with the running application. It is
 * composed of `Fixtures` which are classes decorated with the `@Fixture` decorator. Fixtures
 * are automatically instantiated and injected into the App object. The App object is then
 * injected into the last (or only) argument of a step definition callback.
 * 
 * i.e.
 * 
 * ```ts
 * // single argument
 * Given('I have 5 cats', (app: App) => {})
 * // Cucumber Expression
 * Given('I have {int} cats', (cats: number, app: App) => {})
 * // Data table
 * Given('I have {int} cats', (cats: number, table: HTable app: App) => {}, HTable)
 * ```
 * 
 * **Note**: The type annotations here are optional. Non-custom Cucumber Expression types
 * will be automatically inferred by their expression template. Custom types will need to
 * be added via declaration file (see docs)
 * 
 * The App is unique across all tests, and is shared between all steps and hooks within a test.
 * If you have any Fixture classes defined, you can add them as constructor parameters of the App
 * to make them available to step Definitions (Fixtures can also be accessed as properties from other Fixtures if not defined here);
 * 
 * ```ts
 * \@\Fixture
 * export class World {}
 * 
 * 
 * \@\Fixture
 * export class Fixture1 {}
 * 
 * \@\Fixture
 * export class Fixture2 {
 *  constructor(readonly fixture1: Fixture1, readonly world: World) {}
 * }
 * 
 * \@\AppType(World)
 * export class App {
 *   constructor(readonly fixture1: Fixture1, readonly fixture2: Fixture2) {}
 * }
 * ```
 */
export interface App {
  world: World;
  di: Container;
}

