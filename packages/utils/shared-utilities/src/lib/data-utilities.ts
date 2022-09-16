export type Some = Record<string, unknown>;

export interface Instantiable<T> extends Function {
  new (...args: unknown[]): T;
}

export interface Constructor<T> extends Function {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  constructor (...args: unknown[]): T;
}

export interface Class<T> extends Instantiable<T>, Constructor<T>{
  
}