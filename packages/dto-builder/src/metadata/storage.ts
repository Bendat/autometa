import type { ClassConstructor } from "../types";

type PropertyKeyLike = string | symbol;

export type DecoratorDefaultValue =
  | { kind: "value"; value: unknown }
  | { kind: "factory"; factory: () => unknown }
  | { kind: "dto"; ctor: ClassConstructor<unknown> };

type DecoratorDefaults = Map<PropertyKeyLike, DecoratorDefaultValue>;

const registry = new WeakMap<ClassConstructor<unknown>, DecoratorDefaults>();

export function recordDecoratorDefault(
  ctor: ClassConstructor<unknown>,
  propertyKey: PropertyKeyLike,
  definition: DecoratorDefaultValue
): void {
  const existing = registry.get(ctor) ?? new Map<PropertyKeyLike, DecoratorDefaultValue>();
  existing.set(propertyKey, definition);
  registry.set(ctor, existing);
}

export function getDecoratorDefaults(ctor: ClassConstructor<unknown>): DecoratorDefaults | undefined {
  return registry.get(ctor);
}

export function getAggregatedDecoratorDefaults(
  ctor: ClassConstructor<unknown>
): DecoratorDefaults {
  const aggregated = new Map<PropertyKeyLike, DecoratorDefaultValue>();
  const chain: ClassConstructor<unknown>[] = [];
  let current: ClassConstructor<unknown> | undefined = ctor;
  while (current && current !== Object) {
    chain.push(current);
    current = Object.getPrototypeOf(current) as ClassConstructor<unknown> | undefined;
  }

  for (let index = chain.length - 1; index >= 0; index -= 1) {
    const ctor = chain[index];
    if (!ctor) {
      continue;
    }
    const defaults = registry.get(ctor);
    if (!defaults) {
      continue;
    }
    for (const [property, definition] of defaults.entries()) {
      aggregated.set(property, definition);
    }
  }

  return aggregated;
}
