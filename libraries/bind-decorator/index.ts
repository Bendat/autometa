// eslint-disable-next-line @typescript-eslint/ban-types
export function Bind<T extends Function>(
  _target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> | void {
  if (!descriptor || typeof descriptor.value !== "function") {
    throw new TypeError(
      `Only methods can be decorated with @bind. <${propertyKey}> is not a method!`
    );
  }

  return {
    configurable: true,
    get(this: T): T {
      const bound: T = descriptor.value?.bind(this);
      Object.defineProperty(this, propertyKey, {
        value: bound,
        configurable: true,
        writable: true,
      });
      return bound;
    },
  };
}
