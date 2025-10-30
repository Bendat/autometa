import { AutomationError } from "@autometa/errors";
import { InvalidKeyError } from "./invalid-key-error";

export function AssertKey<TObj>(
  item: TObj,
  key: unknown,
  context?: string
): asserts key is keyof TObj {
  const prefix = context ? `${context}: ` : "";
  if (item === null || item === undefined) {
    throw new AutomationError(
      `${prefix}Item cannot be null or undefined if indexing for values. ${String(
        key
      )} is not a valid property of ${item}`
    );
  }
  if (!(typeof item === "object" || typeof item === "function")) {
    throw new AutomationError(
      `${prefix}A key can only be valid for a value whose type is object or function: Type ${typeof item} is not valid`
    );
  }
  if (key && typeof key == "string" && key in item) {
    return;
  }
  throw new InvalidKeyError(key as string, item);
}
