import { metadata } from "./metadata";
import { AutometaSymbol } from "./symbol";
import { InjectorKey } from "./types";

/**
 * Defines the constructor signature for an injectable class.
 * Takes a Rest Parameter of Classes or Injection Tokens which
 * match the constructor signature of the class.
 *
 * ```ts
 * ＠Fixture
 * ＠Constructor(HttpClient)
 * class MyClient {
 *    constructor(
 *      readonly http: HttpClient,
 *    ) {}
 *
 *    get() {
 *      return this.http.get("https://example.com");
 *    }
 * }
 * ```
 *
 * The `MyClient` class is now injectable and can be used automatically
 * by adding it to the `App` with the same method.
 *
 * ```ts
 * ＠AppType(World)
 * ＠Constructor(MyClient)
 * class App {
 *   constructor(
 *    readonly client: MyClient,
 *  ) {}
 * }
 * ```
 *
 * @param args A Rest Parameter of Classes or Injection Tokens which can be used to automatically inject new, cached or singleton dependencies into this class
 */
export function Constructor<T extends InjectorKey[]>(...args: T) {
  return function (target: object) {
    metadata(target).custom(AutometaSymbol.CONSTRUCTOR, args);
  };
}
