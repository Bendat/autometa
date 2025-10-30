import { AutomationError } from "./automation-error";

export interface SafeOk<T> {
  readonly ok: true;
  readonly value: T;
}

export interface SafeErr {
  readonly ok: false;
  readonly error: AutomationError;
}

export type SafeResult<T> = SafeOk<T> | SafeErr;

/**
 * Execute the callback and capture any thrown error as an {@link AutomationError}.
 */
export function safe<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => TResult,
  ...args: TArgs
): SafeResult<TResult> {
  try {
    return { ok: true, value: action(...args) };
  } catch (error) {
    return { ok: false, error: AutomationError.wrap(error) };
  }
}

/**
 * Async variant of {@link safe}. Returns a promise that resolves with the value
 * or the captured {@link AutomationError}.
 */
export async function safeAsync<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult> | TResult,
  ...args: TArgs
): Promise<SafeResult<TResult>> {
  try {
    return { ok: true, value: await action(...args) };
  } catch (error) {
    return { ok: false, error: AutomationError.wrap(error) };
  }
}
