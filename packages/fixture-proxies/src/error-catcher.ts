import { AutomationError } from "@autometa/errors";
import { AnyFunction } from "./any-function";

const methodHandler = {
  apply(target: AnyFunction, thisArg: unknown, argArray?: unknown) {
    try {
      return target.call(thisArg, argArray);
    } catch (e) {
      const error = e as Error;
      const targetName = getObjectName(thisArg as object);
      const message = `An Error occurred in ${targetName} while executing function ${target.name}`;
      throw new AutomationError(message, { cause: error });
    }
  },
} as ProxyHandler<AnyFunction>;

function getObjectName(obj: object) {
  if (typeof obj === "function") {
    return obj.name;
  }
  if ("constructor" in obj) {
    return obj.constructor.name;
  }
  return Object.toString();
}

export function ErrorCatcherProxy<T extends object>(target: T) {
  const cache = target as Record<string, AnyFunction>;
  const keys = Object.keys(target);
  for (const key of keys) {
    if (key in cache && typeof cache[key] === "function") {
      cache[key] = new Proxy(cache[key], methodHandler);
    }
  }
  return target;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
export function DecorateErrorCatch<T extends { new (...args: any[]): {} }>(
  constructor: T
) {
  const decorated = class extends constructor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      ErrorCatcherProxy(this);
    }
  };
  return decorated as unknown as T;
}
