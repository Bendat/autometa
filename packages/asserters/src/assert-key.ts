import { AutomationError } from "@autometa/errors";
import { closestMatch } from "closest-match";

/**
 * Custom error for invalid object key access with helpful suggestions.
 */
export class InvalidKeyError<T extends object> extends AutomationError {
  constructor(
    public readonly key: string,
    public readonly target: T,
    public readonly suggestions: string[],
    context?: string
  ) {
    const prefix = context ? `[${context}] ` : "";
    const targetType = target.constructor?.name ?? "Object";
    const suggestionText = suggestions.length > 0
      ? `\n\nDid you mean one of these?\n  ${suggestions.join("\n  ")}`
      : "";
    
    super(
      `${prefix}Key "${key}" does not exist on ${targetType}.${suggestionText}`
    );
  }
}

/**
 * Asserts that a key exists on an object, narrowing the key type.
 * 
 * @param target - The object to check
 * @param key - The key to verify
 * @param context - Optional context for error messages
 * @throws {InvalidKeyError} If key doesn't exist on target
 * 
 * @example
 * ```ts
 * const config: Record<string, unknown> = getConfig();
 * assertKey(config, "apiKey");
 * // "apiKey" is now typed as keyof typeof config
 * const key = config.apiKey;
 * ```
 */
export function assertKey<T extends object>(
  target: T,
  key: unknown,
  context?: string
): asserts key is keyof T {
  // Validate target
  if (target === null || target === undefined) {
    const prefix = context ? `[${context}] ` : "";
    throw new AutomationError(
      `${prefix}Cannot check key "${String(key)}" on ${target}`
    );
  }
  
  // Validate key type
  if (typeof key !== "string" && typeof key !== "symbol" && typeof key !== "number") {
    const prefix = context ? `[${context}] ` : "";
    throw new AutomationError(
      `${prefix}Key must be string, symbol, or number, got ${typeof key}`
    );
  }
  
  // Check if key exists
  if (key in target) {
    return;
  }
  
  // Generate helpful suggestions for string keys
  const suggestions = typeof key === "string"
    ? findSimilarKeys(key, target)
    : [];
  
  throw new InvalidKeyError(String(key), target, suggestions, context);
}

/**
 * Type guard to check if a key exists on an object.
 * Non-throwing version of assertKey.
 * 
 * @param target - The object to check
 * @param key - The key to verify
 * @returns true if key exists on target
 * 
 * @example
 * ```ts
 * if (confirmKey(config, "apiKey")) {
 *   // TypeScript knows apiKey exists
 *   console.log(config.apiKey);
 * }
 * ```
 */
export function confirmKey<T extends object>(
  target: T,
  key: unknown
): key is keyof T {
  if (target === null || target === undefined) {
    return false;
  }
  if (typeof key !== "string" && typeof key !== "symbol" && typeof key !== "number") {
    return false;
  }
  return key in target;
}

/**
 * Safely retrieves a value from an object, asserting the key exists.
 * 
 * @param target - The object to access
 * @param key - The key to retrieve
 * @param context - Optional context for error messages
 * @returns The value at the key
 * @throws {InvalidKeyError} If key doesn't exist on target
 * 
 * @example
 * ```ts
 * const value = getKey(config, "apiKey");
 * // TypeScript knows the value type from the object
 * ```
 */
export function getKey<T extends object, K extends keyof T>(
  target: T,
  key: K,
  context?: string
): T[K];
export function getKey<T extends object>(
  target: T,
  key: string,
  context?: string
): unknown;
export function getKey<T extends object>(
  target: T,
  key: string,
  context?: string
): unknown {
  assertKey(target, key, context);
  return target[key as keyof T];
}

/**
 * Finds similar keys in an object for helpful error messages.
 */
function findSimilarKeys<T extends object>(searchKey: string, target: T): string[] {
  const keys = Object.keys(target);
  if (keys.length === 0) {
    return [];
  }
  
  const matches = closestMatch(searchKey, keys, true);
  if (!matches) {
    return [];
  }
  
  return Array.isArray(matches) ? matches.slice(0, 3) : [matches];
}
