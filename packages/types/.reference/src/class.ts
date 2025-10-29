export type Class<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type AbstractClass<T> = Function & { prototype: T };
