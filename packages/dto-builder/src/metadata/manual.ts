import { cloneValue } from "../utils";
import type { DefaultsInput } from "../types";
import { createEmptyBlueprint, type BuilderBlueprint, type PropertyBlueprint } from "./blueprint";

export function createManualDefaultsBlueprint<T>(input?: DefaultsInput<T>): BuilderBlueprint<T> {
  const blueprint = createEmptyBlueprint<T>();
  if (!input) {
    return blueprint;
  }

  for (const key of Object.keys(input) as Array<keyof T>) {
    const definition = input[key];
    if (undefined === definition) {
      continue;
    }

    const property: PropertyBlueprint<T, typeof key> = blueprint.properties[key] ?? {};

    if ("function" === typeof definition) {
      property.defaultFactory = definition as () => T[typeof key];
    } else {
      const snapshot = cloneValue(definition as T[typeof key]);
      property.defaultFactory = () => cloneValue(snapshot);
    }

    blueprint.properties[key] = property;
  }

  return blueprint;
}
