import "@autometa/types";
import { AppType as at } from "@autometa/app";
import { CoordinatorOpts } from "@autometa/coordinator";
export { AutometaApp, AutometaWorld, App, World } from "@autometa/app";
export {
  Fixture,
  INJECTION_SCOPE,
  InjectionScope,
  Token,
  Container,
  Constructor,
  Inject,
} from "@autometa/injection";
export const OPTS = {} as Record<string, CoordinatorOpts>;
/**
 * Marks a class as being the `App` of the test framework. The `App` is the
 * entry point for the test framework. The App will be made available as the final
 * argument in the Step Definition Callbacks.
 *
 * ```ts
 *
 * ＠AppType(World)
 * ＠Constructor(MyClient)
 * class App {
 *  constructor(readonly myCLient: MyClient) {}
 * }
 * ```
 * Or with tokens
 *
 * ```ts
 * import from "@autometa/runner";
 * import { World } from "./default.world";
 * @AppType(World)
 * @Constructor(HTTP, Token("MyClient"))
 * class App {
 *  constructor(readonly http: HTTP, readonly myClient: MyClient) {}
 * }
 * ```
 */
export const AppType = at.bind(null, OPTS);
export { getApp } from "@autometa/app";
export { DisposeMethod, DisposeTagFilter } from "@autometa/injection";
