import "reflect-metadata";

import { Class } from "@autometa/types";
import {
  scoped,
  inject,
  Lifecycle,
  injectable,
  InjectionToken
} from "tsyringe";
import { AutometaWorld } from "..";
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
export function Fixture(scope = Lifecycle.ContainerScoped) {
  return (target: Class<unknown>) => {
    injectable()(target);
    scoped(scope as Lifecycle.ContainerScoped | Lifecycle.ResolutionScoped)(
      target
    );
  };
}

export function Inject() {
  return (target: InjectionToken<unknown>) => {
    inject(target);
  };
}

export const AppSymbol = Symbol("App");
export const WorldSymbol = Symbol("World");
export const EnvironmentSymbol = Symbol("AppTypeOptions");

export function AppType(
  container: Record<string | symbol, unknown>,
  world: AutometaWorld,
  environment?: string
) {
  return (target: Class<unknown>) => {
    container[AppSymbol] = target;
    container[EnvironmentSymbol] = environment ?? "default";
    container[WorldSymbol] = world;
  };
}
