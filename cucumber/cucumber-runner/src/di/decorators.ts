import { injectable, scoped, inject, Lifecycle } from "tsyringe";
/**
 * Marks a class as an injectable fixture. Constructor parameters
 * which are also injectable will be automatically constructed
 * and passed to the constructor.
 *
 * Example fixtures are the `App` which acts as  shared
 * entry point for all steps in a test, and the World,
 * which stores persistent data across tests.
 *
 * Fixtures which store data that must be preserved
 * should also be annotated with `@Persistent`
 * ```ts
 * ＠Fixture
 * ＠Persistent
 * export class World {
 *  [key: string]: unknown;
 *
 *  declare someExpectedData: MyDataType
 * }
 *
 * ＠Fixture
 * ＠Persistent
 * export class MyClient {
 *   constructor(world: MyWorld){}
 *
 *    login = async ()=>{
 *      this.world.someExpectedData = await fetch(...)
 *    }
 * }
 *
 * ＠Fixture
 * ＠Persistent
 * export class App {
 *    constructor(
 *      world: MyWorld,
 *      client: MyClient
 *    ){}
 * }
 * ```
 */
export const Fixture = injectable();
export const Scope = scoped;
/**
 * Marks that a fixture should act like a singleton
 * within a test, with a single instance being shared
 * across all dependents.
 *
 * ```ts
 * ＠Fixture
 * ＠Persistent
 * export class World {
 *  [key: string]: unknown;
 *
 *   declare someExpectedData: MyDataType
 * }
 * ```
 */
export const Persistent = scoped(Lifecycle.ContainerScoped);
export const Inject = inject;
export { Lifecycle };
