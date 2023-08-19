import { AutomationError } from "@autometa/errors";
export function AssertIs<TIsType>(
  value: unknown,
  type: TIsType,
  context?: string
): asserts value is TIsType {
  const prefix = context ? `${context}: ` : "";
  const message = `${prefix}Expected ${type} but got ${value}`;
  if (value !== type && typeof value !== type) {
    throw new AutomationError(message);
  }
  if (value !== type && typeof value !== typeof type) {
    throw new AutomationError(message);
  }
  if (type !== null && value === null) {
    throw new AutomationError(message);
  }
  if (type !== undefined && value === undefined) {
    throw new AutomationError(message);
  }
  if (typeof type === "function") {
    if (value instanceof type) {
      return;
    }
    throw new AutomationError(
      `${prefix}Expected ${type} to be instance of ${value}`
    );
  }
}
