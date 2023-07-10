
export interface BuilderClass<T> {
  new (...args: unknown[]): T;
  // default(): T;
}
export type Dict = { [key: string]: unknown };
