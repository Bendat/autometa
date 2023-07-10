
export interface BuilderClass<T> {
  new (...args: unknown[]): T;
  // default(): T;
}
export type Dict = { [key: string]: unknown };

export type Class<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): T;
};
