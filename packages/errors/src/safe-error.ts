import { AutomationError } from "./automation-error";

export function safe<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (...args: any) => T ,
  ...args: unknown[]
): AutomationError | T {
  try{
    return action(...args);
  } catch (e) {
    return e as AutomationError
  }
}

export async function safeAsync<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (...args: any) => T | Promise<T>,
  ...args: unknown[]
): Promise<AutomationError | T> {
  try{
    return await action(...args);
  } catch (e) {
    return e as AutomationError
  }
}
