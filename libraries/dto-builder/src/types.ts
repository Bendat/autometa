export interface BuilderClass<T> {
  new (...args: unknown[]): T;
}
export type Dict = { [key: string]: unknown };
