/**
 * Fake type checker function. Whatever value is passed into this function will be returned as the specified type,
 * casting it (automatically where possible) for if-checks and other type-checking operations.
 * ```ts
 * const value: unknown = 5;
 *
 * // This will throw an error because the value is not a string
 * console.log(value.length);
 *
 * // This will not throw an error because the value is now treated as a string
 * fib<string>(value).length;
 * ```
 * @param value
 * @returns
 */
export function fib<T>(value: unknown): T {
  return value as T;
}

/**
 * Lies about the type of an object. All lines after this is called will treat
 * the value passed in as the specified type.
 *
 * ```ts
 * const value: unknown = { a: 1, b: 2 };
 *
 * // This will throw an error because the object does not have a property 'c'
 * console.log(value.c);
 *
 * // This will not throw an error because the object is now treated as having a property 'c'
 * lie<{ a: number, b: number, c: number }>(value);
 * console.log(value.c);
 *
 * ```
 * @param value
 * @returns
 */
export function lie<T>(value: unknown): asserts value is T {
  return;
}
