import { Class } from "@autometa/types";
import { INJECTION_SCOPE, InjectionScope } from "./scope.enum";
import { registerScope } from "./metadata-registry";

/**
 * Marks a class as injectable. Optionally,
 * an Injection Scope can be defined, which determines
 * the strategy used to initialize the decorated class.
 * 
 * INJECTION_SCOPE.CACHED: The class will be initialized once per container, but behave as a singleton within the container
 * INJECTION_SCOPE.SINGLETON: The class will be initialized once per container, and behave as a singleton across all containers
 * INJECTION_SCOPE.TRANSIENT: The class will be initialized once per injection, it will not be cached.
 * 
 * By default if no scope is specified, the class will be cached. Once created all dependant sharing a container will share this instance.
 * @param target 
 */
export function Fixture(target: Class<unknown>): void;
export function Fixture<T extends Class<unknown>>(
  scope?: InjectionScope
): (target: T) => void;
export function Fixture(
  arg: InjectionScope | undefined | Class<unknown>
): void | ((target: Class<unknown>) => void) {
  if (arg !== undefined && typeof arg !== "number") {
    registerScope(arg, INJECTION_SCOPE.CACHED);
    return;
  }
  return (target: Class<unknown>) => {
    registerScope(target, arg ?? INJECTION_SCOPE.CACHED);
  };
}
