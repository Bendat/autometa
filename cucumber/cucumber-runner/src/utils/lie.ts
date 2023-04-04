/**
 * Lie about an objects type to conform to
 * a function parameter or assignment.
 *
 * Not a replacement for `as X` or `as unknown as X`.
 * A lie is an intentional call to trick the compiler,
 * not way to tell the compiler you know more about this
 * types final structure.
 *
 * For example, when sending bad data to a test client to
 * test error responses.
 *
 * @param input - the object to lie about
 * @returns - The object, but lied about
 */
export function lie<T>(input: unknown): T {
  return input as T;
}

/**
 * Similar to a {@link lie}, takes an input
 * and lies about it's type. But rather than cast it to
 * a type, it always returns that input `is` a type,
 * which will be available in the context of an if statement.
 *
 * ```ts
 * const a: unknown = 'hello';
 * if (confirm<string>(a)) {
 *   const b = a.charAt(0); // OK
 * }
 * const b = a.charAt(0); // Compile error
 * ```
 * @param _input
 * @returns
 */

export function confirm<T>(_input: unknown): _input is T {
  return true;
}
