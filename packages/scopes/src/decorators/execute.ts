import { FeatureScope } from "../feature-scope";
export type OnFeatureExecuted = (...args: unknown[]) => unknown;
// eslint-disable-next-line @typescript-eslint/ban-types
export function Execute<T extends Function>(
  target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> | void {
  return {
    configurable: true,
    get(this: T): T {
      const bound: T = descriptor.value?.bind(this);

      const wrapper = (...args: unknown[]) => {
        const onFeatureExecuted = getExecutor(this);
        const result = bound(...args);
        onFeatureExecuted(result);
        return result;
      };

      Object.defineProperty(this, propertyKey, {
        value: wrapper,
        configurable: true,
        writable: true,
      });
      return wrapper as unknown as T;
    },
  };
}

function getExecutor(target: unknown) {
  if (typeof target !== "object" || target === null) {
    throw new Error("Decorator must be applied to a class object");
  }
  if ("onFeatureExecuted" in target) {
    return target.onFeatureExecuted as OnFeatureExecuted;
  }
  throw new Error(
    "Decorator Target must have a callback function called 'onFeatureExecuted'"
  );
}
