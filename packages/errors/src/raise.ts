import { AutomationError } from "./automation-error";
import { Class } from "@autometa/types";

export function raise<T extends Class<Error> = typeof AutomationError>(
  message: string,
  errorType?: T,
): never {
  if (errorType) {
    throw new errorType(message);
  }
  throw new AutomationError(message);
}
