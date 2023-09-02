import { AutomationError } from "./automation-error";
import { Class } from "@autometa/types";

export function raise(
  message: string,
  opts?: { cause?: Error; type?: Class<AutomationError> }
): never {
  const actual = opts ?? {};
  if (actual.type && actual.type.prototype instanceof Error) {
    throw new actual.type(message, { cause: actual.cause });
  }
  throw new AutomationError(message, { cause: actual.cause });
}
