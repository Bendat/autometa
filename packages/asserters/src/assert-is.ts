import { AutomationError } from "@autometa/errors";

/**
 * Asserts that a value matches an expected type or instance.
 * 
 * @param value - The value to check
 * @param expected - The expected type (string, constructor, or value)
 * @param context - Optional context for error messages
 * @throws {AutomationError} If value doesn't match expected type
 * 
 * @example
 * ```ts
 * // Type checking
 * assertIs(value, "string");
 * assertIs(value, "number");
 * 
 * // Instance checking
 * assertIs(error, Error);
 * assertIs(date, Date);
 * 
 * // Value checking
 * assertIs(status, 200);
 * assertIs(flag, true);
 * ```
 */
export function assertIs<T>(
  value: unknown,
  expected: T,
  context?: string
): asserts value is T {
  const prefix = context ? `[${context}] ` : "";
  
  // Handle constructor/class checks
  if (typeof expected === "function") {
    // eslint-disable-next-line @typescript-eslint/ban-types
    if (value instanceof (expected as Function)) {
      return;
    }
    const expectedName = (expected as { name?: string }).name ?? "Constructor";
    throw new AutomationError(
      `${prefix}Expected instance of ${expectedName}, but got ${getTypeName(value)}`
    );
  }
  
  // Handle primitive type checks
  const expectedType = typeof expected;
  const actualType = typeof value;
  
  if (expectedType === actualType) {
    // Special case: undefined and null can only match themselves
    if (value === undefined && expected === undefined) {
      return;
    }
    if (value === null && expected === null) {
      return;
    }
    // For primitives, check both type and value
    if (isPrimitive(expected) && value === expected) {
      return;
    }
    // For objects (not null), just check type match
    if (actualType === "object" && value !== null) {
      return;
    }
  }
  
  // Handle typeof string checks (e.g., "string", "number")
  if (typeof expected === "string" && actualType === expected) {
    return;
  }
  
  throw new AutomationError(
    `${prefix}Expected ${formatExpected(expected)}, but got ${formatActual(value)}`
  );
}

function isPrimitive(value: unknown): value is string | number | boolean | symbol | bigint {
  const type = typeof value;
  return type === "string" || type === "number" || type === "boolean" || 
         type === "symbol" || type === "bigint";
}

function getTypeName(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "object") {
    return value.constructor?.name ?? "Object";
  }
  return typeof value;
}

function formatExpected(expected: unknown): string {
  if (typeof expected === "string") {
    return `type "${expected}"`;
  }
  return `value ${JSON.stringify(expected)}`;
}

function formatActual(value: unknown): string {
  const type = getTypeName(value);
  if (value === null || value === undefined) {
    return type;
  }
  try {
    const str = JSON.stringify(value);
    return `${type} ${str}`;
  } catch {
    return type;
  }
}
