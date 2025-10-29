/**
 * Generic constructor signature producing `TInstance` from `TArgs`.
 */
export type Constructor<TInstance = unknown, TArgs extends unknown[] = unknown[]> = new (
  ...args: TArgs
) => TInstance;

/**
 * Describes an abstract constructor, typically a class with abstract members.
 */
export type AbstractConstructor<TInstance = unknown, TArgs extends unknown[] = unknown[]> = abstract new (
  ...args: TArgs
) => TInstance;

/**
 * @deprecated Use {@link Constructor} instead.
 */
export type Class<TInstance> = Constructor<TInstance>;

/**
 * @deprecated Use {@link AbstractConstructor} instead.
 */
export type AbstractClass<TInstance> = AbstractConstructor<TInstance>;
