import { AsyncLocalStorage } from "node:async_hooks";

export const WorldContext = new AsyncLocalStorage<unknown>();

export function getWorld<T = unknown>(): T {
  const store = WorldContext.getStore();
  if (store === undefined) {
    throw new Error(
      "World context is not available. Are you running inside a scenario?"
    );
  }
  return store as T;
}

export function tryGetWorld<T = unknown>(): T | undefined {
  return WorldContext.getStore() as T | undefined;
}
