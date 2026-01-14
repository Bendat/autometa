import { AsyncLocalStorage } from "node:async_hooks";

const WORLD_CONTEXT_KEY = "__AUTOMETA_EXECUTOR_WORLD_CONTEXT__";

type GlobalWithWorldContext = typeof globalThis & {
  [WORLD_CONTEXT_KEY]?: AsyncLocalStorage<unknown>;
};

const globalTarget = globalThis as GlobalWithWorldContext;

const getOrCreateWorldContext = (): AsyncLocalStorage<unknown> => {
  const existing = globalTarget[WORLD_CONTEXT_KEY];
  if (existing) {
    return existing;
  }
  const created = new AsyncLocalStorage<unknown>();
  globalTarget[WORLD_CONTEXT_KEY] = created;
  return created;
};

export const WorldContext = getOrCreateWorldContext();

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
