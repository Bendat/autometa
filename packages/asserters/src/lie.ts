export function fib<T>(value: unknown): T {
  return value as T;
}

export function lie<T>(value: unknown): asserts value is T {
  return;
}
