import { AutomationError } from "@autometa/errors";

type LengthLike = { length: number };

/**
 * Asserts that an array or string has an exact length.
 * 
 * @param value - Array or string to check
 * @param expectedLength - Expected length
 * @param context - Optional context for error messages
 * @throws {AutomationError} If length doesn't match
 * 
 * @example
 * ```ts
 * assertLength(args, 3, "function arguments");
 * assertLength(username, 5, "username");
 * ```
 */
export function assertLength<T extends LengthLike>(
  value: T,
  expectedLength: number,
  context?: string
): asserts value is T & { length: typeof expectedLength } {
  if (!hasLength(value)) {
    const prefix = context ? `[${context}] ` : "";
    throw new AutomationError(
      `${prefix}Cannot check length on ${getTypeName(value)}`
    );
  }
  
  if (value.length !== expectedLength) {
    const prefix = context ? `[${context}] ` : "";
    const typeName = Array.isArray(value) ? "array" : "string";
    throw new AutomationError(
      `${prefix}Expected ${typeName} length ${expectedLength}, but got ${value.length}`
    );
  }
}

/**
 * Asserts that an array or string has at least a minimum length.
 * 
 * @param value - Array or string to check
 * @param minLength - Minimum required length
 * @param context - Optional context for error messages
 * @throws {AutomationError} If length is too short
 * 
 * @example
 * ```ts
 * assertMinLength(password, 8, "password");
 * assertMinLength(items, 1, "cart items");
 * ```
 */
export function assertMinLength<T extends LengthLike>(
  value: T,
  minLength: number,
  context?: string
): void {
  if (!hasLength(value)) {
    const prefix = context ? `[${context}] ` : "";
    throw new AutomationError(
      `${prefix}Cannot check length on ${getTypeName(value)}`
    );
  }
  
  if (value.length < minLength) {
    const prefix = context ? `[${context}] ` : "";
    const typeName = Array.isArray(value) ? "array" : "string";
    throw new AutomationError(
      `${prefix}Expected ${typeName} length >= ${minLength}, but got ${value.length}`
    );
  }
}

/**
 * Asserts that an array or string has at most a maximum length.
 * 
 * @param value - Array or string to check
 * @param maxLength - Maximum allowed length
 * @param context - Optional context for error messages
 * @throws {AutomationError} If length is too long
 * 
 * @example
 * ```ts
 * assertMaxLength(description, 280, "tweet");
 * assertMaxLength(items, 10, "cart limit");
 * ```
 */
export function assertMaxLength<T extends LengthLike>(
  value: T,
  maxLength: number,
  context?: string
): void {
  if (!hasLength(value)) {
    const prefix = context ? `[${context}] ` : "";
    throw new AutomationError(
      `${prefix}Cannot check length on ${getTypeName(value)}`
    );
  }
  
  if (value.length > maxLength) {
    const prefix = context ? `[${context}] ` : "";
    const typeName = Array.isArray(value) ? "array" : "string";
    throw new AutomationError(
      `${prefix}Expected ${typeName} length <= ${maxLength}, but got ${value.length}`
    );
  }
}

function hasLength(value: unknown): value is LengthLike {
  return (
    value !== null &&
    value !== undefined &&
    typeof (value as LengthLike).length === "number"
  );
}

function getTypeName(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
