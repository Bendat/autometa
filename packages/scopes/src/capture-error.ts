import { AutomationError } from "@autometa/errors";

export function safe(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (...args: any[]) => any | Promise<any>,
  ...args: unknown[]
): AutomationError | undefined | Promise<AutomationError | undefined> {
  const result = action(...args);
  if (result instanceof Promise) {
    return result.catch((e) => e as AutomationError);
  }
  return result;
}
