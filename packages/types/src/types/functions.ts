/**
 * Any callable signature preserving argument and return typing.
 */
export type AnyFunction<TResult = unknown, TArgs extends unknown[] = unknown[]> = (
  ...args: TArgs
) => TResult;

/**
 * Alias for functions commonly used as test callbacks.
 */
export type TestFunction<TArgs extends unknown[] = unknown[], TResult = unknown> = (
  ...args: TArgs
) => TResult;
