import type { Validator } from "../types";
import { createEmptyBlueprint, type BuilderBlueprint } from "./blueprint";

export function createValidatorBlueprint<T>(validator?: Validator<T>): BuilderBlueprint<T> {
  const blueprint = createEmptyBlueprint<T>();
  if (!validator) {
    return blueprint;
  }
  blueprint.validators.push(validator);
  return blueprint;
}
