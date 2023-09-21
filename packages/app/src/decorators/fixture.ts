import "reflect-metadata";

import { Class } from "@autometa/types";
import { scoped, inject, Lifecycle as LC, injectable } from "tsyringe";
/**
 * Marks a class as an injectable fixture. Constructor parameters
 * which are also injectable will be automatically constructed
 * and passed to the constructor.
 *
 * Example fixtures are the `App` which acts as  shared
 * entry point for all steps in a test, and the World,
 * which stores persistent data across tests.
 *
 * Fixtures are persistent by default, meaning each class
 * will exist as a singleton for the duration of the test
 * ```ts
 * ＠Fixture
 * export class World {
 *  [key: string]: unknown;
 *
 *  declare someExpectedData: MyDataType
 * }
 *
 * ＠Fixture
 * export class MyClient {
 *   constructor(world: MyWorld){}
 *
 *    login = async ()=>{
 *      this.world.someExpectedData = await fetch(...)
 *    }
 * }
 *
 * ＠Fixture
 * export class App {
 *    constructor(
 *      world: MyWorld,
 *      client: MyClient
 *    ){}
 * }
 * ```
 */
export function Fixture(target: Class<unknown>): void;
export function Fixture(scope?: LC): (target: Class<unknown>) => void;
export function Fixture(arg: LC | undefined | Class<unknown>) {
  if (arg && typeof arg !== "number") {
    injectable()(arg);
    scoped(LC.ContainerScoped)(arg);
    return;
  }
  return (target: Class<unknown>) => {
    injectable()(target);
    scoped(arg as LC.ContainerScoped | LC.ResolutionScoped)(target);
  };
}

export const Inject = inject;
export const Lifecycle = LC;
