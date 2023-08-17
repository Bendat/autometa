import { AutomationError } from "./automation-error";
import { Class } from "@autometa/types";

export function raise(message: string): never;
export function raise<T extends Class<Error>>(
  message: string,
  errorType: T
): never;
export function raise(
  message: string,
  errorType?: Class<AutomationError>,
  opts?: { cause: Error }
): never {
  if (errorType) {
    throw new errorType(message, opts);
  }
  throw new AutomationError(message, opts);
}
