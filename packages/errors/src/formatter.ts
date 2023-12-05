import { AutomationError } from "./automation-error";
import mergeErrorCause from "merge-error-cause";
export function formatErrorCauses(error: AutomationError) {
  return mergeErrorCause(error);
}
