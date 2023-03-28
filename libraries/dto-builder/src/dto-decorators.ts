import "reflect-metadata";
function key(name: string) {
  return `dto:annotation:properties:${name}`;
}
function defaults(name: string) {
  return `dto:annotation:defaults:${name}`;
}
type decoratorFunction = (
  target: { constructor: { name: string } },
  propertyKey: string | symbol
) => void;

/**
 * Declares a class property to be a DTO property, which makes
 * it available for autogenerated builder classes.
 *
 * @returns a PropertyDecorator wrapping the class property.
 */
export function Property<T>(defaultValue: T): decoratorFunction;
export function Property(
  target: { constructor: { name: string } },
  propertyKey: string | symbol
): void;
export function Property<T = never>(...args: unknown[]): unknown | decoratorFunction {
  if (args.length >= 2) {
    const [target, propertyKey] = args as [{ constructor: { name: string } }, string];
    const { constructor } = target;
    const { name } = constructor;
    const variables: Set<unknown> =
      Reflect.getOwnMetadata(key(name), target.constructor) ?? new Set();
    variables.add(propertyKey);
    Reflect.defineMetadata(key(name), variables, target.constructor);
    return;
  }
  return (target: { constructor: { name: string } }, propertyKey: string | symbol) => {
    const [defaultValue] = args as T[];
    const { constructor } = target;
    const { name } = constructor;
    const variables: Set<unknown> =
      Reflect.getOwnMetadata(key(name), target.constructor) ?? new Set();
    variables.add(propertyKey);
    Reflect.defineMetadata(key(name), variables, target.constructor);
    const defaultValues: Set<unknown> =
      Reflect.getOwnMetadata(defaults(name), target.constructor) ?? new Set();
    defaultValues.add({ propertyKey, defaultValue });
    Reflect.defineMetadata(defaults(name), defaultValues, target.constructor);
  };
}

/**
 * Retrieves a Set of property names which exist
 * on a DTO and which have been declared with the `@Property` decorator.
 *
 * @param target The DTO instance to check against
 * @returns A list of property names from the DTO object.
 */
export function getDtoPropertyDecorators(target: { constructor: { name: string } }): string[] {
  // get info about keys that used in current property
  return Reflect.getOwnMetadata(key(target.constructor.name), target.constructor);
}

export function getDtoDefaultsDecorators(target: {
  constructor: { name: string };
}): Set<{ propertyKey: string; defaultValue: unknown }> {
  // get info about keys that used in current property
  return Reflect.getOwnMetadata(defaults(target.constructor.name), target.constructor);
}

export function isDto(target: Record<string, unknown>) {
  if (!target || !target.constructor) {
    return false;
  }
  return Reflect.hasOwnMetadata(defaults(target.constructor.name), target.constructor);
}