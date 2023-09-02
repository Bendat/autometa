import { AutomationError } from "@autometa/errors";

export function safe(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (...args: any[]) => any | Promise<any>,
  ...args: unknown[]
): AutomationError | undefined | Promise<AutomationError | undefined> {
  try {
    return action(...args);
  } catch (e) {
    return e as AutomationError;
  }
}
