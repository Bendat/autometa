import { AutomationError } from "@autometa/errors";
import { AnyFunction } from "@autometa/types";
import { InvalidKeyError } from "./invalid-key-error";

export function AssertKey<TObj extends Record<string, unknown> | AnyFunction>(
  item: TObj,
  key: string | keyof TObj
): asserts key is keyof TObj {
  if (item === null || item === undefined) {
    throw new AutomationError(
      `Item cannot be null or undefined if indexing for values. ${String(
        key
      )} is not a valid property of ${item}`
    );
  }
  if (!(typeof item === "object" || typeof item === "function")) {
    throw new AutomationError(
      `A key can only be valid for a value whose type is object or function: Type ${typeof item} is not valid`
    );
  }
  if (key && typeof key == "string" && key in item) {
    return;
  }
  throw new InvalidKeyError(key as string, item);
}
