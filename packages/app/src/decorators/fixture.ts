import "reflect-metadata";

import { Class } from "@autometa/types";
import {
  scoped,
  inject,
  Lifecycle as LC,
  injectable,
  singleton
} from "tsyringe";
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
export function Fixture<T extends Class<unknown>>(
  scope?: Lifecycle
): (target: T) => void;
export function Fixture(arg: Lifecycle | undefined | Class<unknown>) {
  if (arg !== undefined && typeof arg !== "number") {
    injectable()(arg);
    scoped(LC.ContainerScoped)(arg);
    return;
  }
  return (target: Class<unknown>) => {
    injectable()(target);
    if (arg === LIFE_CYCLE.Singleton) {
      singleton()(target);
      return;
    }
    scoped(arg ?? (LIFE_CYCLE.ContainerScoped as number))(target);
  };
}

export const Inject = inject;

export const LIFE_CYCLE = {
  Transient: LC.Transient as 0,
  Singleton: LC.Singleton as 1,
  ResolutionScoped: LC.ResolutionScoped as 2,
  ContainerScoped: LC.ContainerScoped as 3
} as const;

export type Lifecycle = (typeof LIFE_CYCLE)[keyof typeof LIFE_CYCLE];
