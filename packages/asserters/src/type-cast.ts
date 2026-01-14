/**
 * Type assertion function that lies to TypeScript about a value's type.
 * Use with caution - no runtime checks are performed.
 * 
 * @param value - Value to cast
 * @returns The same value, typed as T
 * 
 * @example
 * ```ts
 * const data: unknown = JSON.parse(response);
 * lie<User>(data);
 * // TypeScript now thinks data is User, but no validation occurred!
 * ```
 */
export function lie<T>(value: unknown): asserts value is T {
  // Intentionally empty - this is a type assertion only
}

/**
 * Unsafely casts a value to a different type without runtime checks.
 * Prefer using proper type guards and assertions when possible.
 * 
 * @param value - Value to cast
 * @returns The same value, typed as T
 * 
 * @example
 * ```ts
 * const config = unsafeCast<Config>(rawData);
 * // Use with caution - no validation!
 * ```
 */
export function unsafeCast<T>(value: unknown): T {
  return value as T;
}
