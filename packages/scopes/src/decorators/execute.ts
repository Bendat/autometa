import { AutomationError } from "@autometa/errors";
import { FeatureScope } from "../feature-scope";

export type OnFeatureExecuted = (feature: FeatureScope ) => unknown;
// eslint-disable-next-line @typescript-eslint/ban-types
export function Execute<T extends Function>(
  _target: object,
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
    throw new AutomationError("Decorator must be applied to a class object");
  }
  if ("onFeatureExecuted" in target) {
    return target.onFeatureExecuted as OnFeatureExecuted;
  }
  throw new AutomationError(
    "Decorator Target must have a callback function called 'onFeatureExecuted'"
  );
}
