import { cloneValue } from "../utils";
import type { ClassConstructor } from "../types";
import { createEmptyBlueprint, type BuilderBlueprint } from "./blueprint";
import {
  getAggregatedDecoratorDefaults,
  type DecoratorDefaultValue,
} from "./storage";

export function collectDecoratorBlueprint<T>(ctor: ClassConstructor<T>): BuilderBlueprint<T> {
  const blueprint = createEmptyBlueprint<T>();
  const defaults = getAggregatedDecoratorDefaults(ctor as ClassConstructor<unknown>);

  for (const [propertyKey, definition] of defaults.entries()) {
    const property = blueprint.properties[propertyKey as keyof T] ?? {};
    property.defaultFactory = createDefaultFactory(definition);
    blueprint.properties[propertyKey as keyof T] = property;
  }

  return blueprint;
}

function createDefaultFactory<T>(definition: DecoratorDefaultValue): () => T {
  switch (definition.kind) {
    case "value":
      return () => cloneValue(definition.value) as T;
    case "factory":
      return () => definition.factory() as T;
    case "dto":
      return () => createDecoratedInstance(definition.ctor) as T;
    default: {
      const exhaustiveCheck: never = definition;
      return () => exhaustiveCheck;
    }
  }
}

function createDecoratedInstance<T>(ctor: ClassConstructor<T>): T {
  const instance = new ctor();
  const defaults = getAggregatedDecoratorDefaults(ctor);

  for (const [propertyKey, definition] of defaults.entries()) {
    const resolver = createDefaultFactory<unknown>(definition);
    const value = resolver();
    Object.defineProperty(instance as object, propertyKey, {
      configurable: true,
      enumerable: true,
      writable: true,
      value,
    });
  }

  return instance;
}
