/**
 * Asserts in a type safe manner that a value is not empty (null or undefined).
 * It can be used in a list::filter to strip non defined values
 * while informing the next method in the chain that all values
 * have been sanitized
 *
 * ```
 * const values = ['a', 'b', null, 'c']
 * values
 *   .filter(value=> !value) // remove empty values
 *   .map(value=> value.length) // compile time type error "cannot get length of undefined"
 *
 * values
 *   .filter(notEmpty)
 *   .map(value => value.length) // all good
 * ```
 * @param value
 * @returns
 */
export const notEmpty = <TValue>(
  value: TValue | null | undefined
): value is TValue => {
  return value !== null && value !== undefined;
};

/**
 * Asserts in a type safe manner that a value is empty (null or undefined).
 * It can be used in a list::filter to strip defined and non-null values
 * while informing the next method in the chain that all values
 * have been sanitized.
 *
 * ```
 * const values = ['a', 'b', null, 'c']
 * values
 *   .filter(isEmpty)
 *   .map(value => value) // all undefined
 * ```
 * @param value
 * @returns
 */
export const isEmpty = <TValue>(
  value: TValue | null | undefined
): value is TValue => {
  return !notEmpty(value);
};
