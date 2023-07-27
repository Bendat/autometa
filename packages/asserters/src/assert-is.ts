import { AutomationError } from "@autometa/errors";
export function AssertIs<TIsType>(
  value: unknown,
  type: TIsType
): asserts value is TIsType {
  if (value !== type && typeof value !== typeof type) {
    throw new AutomationError(`Expected ${type} but got ${value}`);
  }
  if (type !== null && value === null) {
    throw new AutomationError(`Expected ${type} but got ${value}`);
  }
  if (type !== undefined && value === undefined) {
    throw new AutomationError(`Expected ${type} but got ${value}`);
  }
  if (typeof type === "function") {
    if (value instanceof type) {
      return;
    }
  }
  throw new AutomationError(`Expected ${type} to be instance of ${value}`);
}
