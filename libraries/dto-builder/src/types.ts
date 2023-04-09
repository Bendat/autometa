export interface BuilderClass<T> extends Function {
  new (...args: unknown[]): T;
  // default(): T;
}
export type Dict = { [key: string]: unknown };
