import { AutomationError } from "@autometa/errors";

/**
 * Asserts that a value is not null or undefined, narrowing its type.
 * 
 * @param value - The value to check
 * @param context - Optional context for error messages
 * @throws {AutomationError} If value is null or undefined
 * 
 * @example
 * ```ts
 * const maybeValue: string | undefined = getValue();
 * assertDefined(maybeValue, "getValue");
 * // maybeValue is now typed as string
 * console.log(maybeValue.toUpperCase());
 * ```
 */
export function assertDefined<T>(
  value: T,
  context?: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    const prefix = context ? `[${context}] ` : "";
    throw new AutomationError(
      `${prefix}Expected value to be defined, but got ${value}`
    );
  }
}
