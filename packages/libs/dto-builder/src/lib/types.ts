/**
 * Declares a type to be an uninstantiated class.
 * I.E. for the `Foo` rather than `new Foo()`
 */
export interface Class<T> extends Function {
  new (...args: unknown[]): T;
}

export type Dict = { [key: string]: unknown };
