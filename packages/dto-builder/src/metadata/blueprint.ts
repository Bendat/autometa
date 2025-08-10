import type { BuilderConfig } from "../builder-factory";
import type { DefaultsRecord, MaybePromise, Validator } from "../types";
import { isPromiseLike } from "../utils";

export interface PropertyBlueprint<T, K extends keyof T> {
  defaultFactory?: () => T[K];
}

export interface BuilderBlueprint<T> {
  properties: Partial<Record<keyof T, PropertyBlueprint<T, keyof T>>>;
  validators: Array<Validator<T>>;
}

export function createEmptyBlueprint<T>(): BuilderBlueprint<T> {
  return {
    properties: {},
    validators: [],
  };
}

export function mergeBlueprints<T>(blueprints: Array<BuilderBlueprint<T>>): BuilderBlueprint<T> {
  const mergedProperties: Partial<Record<keyof T, PropertyBlueprint<T, keyof T>>> = {};
  const validators: Array<Validator<T>> = [];

  for (const blueprint of blueprints) {
    for (const key of Object.keys(blueprint.properties) as Array<keyof T>) {
      const property = blueprint.properties[key];
      if (!property) {
        continue;
      }
      const existing = mergedProperties[key] ?? {};
      mergedProperties[key] = {
        ...existing,
        ...property,
      };
    }
    validators.push(...blueprint.validators);
  }

  return {
    properties: mergedProperties,
    validators,
  };
}

export function blueprintToBuilderConfig<T>(
  createTarget: () => T,
  blueprint: BuilderBlueprint<T>
): BuilderConfig<T> {
  const defaults: DefaultsRecord<T> = {};
  for (const key of Object.keys(blueprint.properties) as Array<keyof T>) {
    const property = blueprint.properties[key];
    if (!property?.defaultFactory) {
      continue;
    }
    defaults[key] = property.defaultFactory;
  }

  const validator = composeValidators(blueprint.validators);
  const config: BuilderConfig<T> = {
    createTarget,
    defaults,
  };

  if (validator) {
    config.validator = validator;
  }

  return config;
}

function composeValidators<T>(validators: Array<Validator<T>>): Validator<T> | undefined {
  if (0 === validators.length) {
    return undefined;
  }

  return (value: T) => runValidators(value, validators, 0);
}

function runValidators<T>(
  value: T,
  validators: Array<Validator<T>>,
  index: number
): MaybePromise<void> {
  for (let cursor = index; cursor < validators.length; cursor += 1) {
    const result = validators[cursor](value);
    if (isPromiseLike(result)) {
      return result.then(() => runValidators(value, validators, cursor + 1));
    }
  }
  return undefined;
}
