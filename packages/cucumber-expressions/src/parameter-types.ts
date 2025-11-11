import {
  ParameterType,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { attachTransform, applyCucumberExtensions } from "./extensions";
import type { ParameterTransformFn } from "./extensions";

type Constructor<T = unknown> = {
  new (...args: unknown[]): T;
  prototype: T;
};

type Factory<T = unknown> = (...args: unknown[]) => T;

type ConstructorOrFactory<T = unknown> = Constructor<T> | Factory<T>;

export type ParameterPrimitive =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | BigIntConstructor
  | DateConstructor;

export interface ParameterTransformContext<World> {
  readonly raw: readonly string[];
  readonly world: World;
}

export type ParameterTransformer<TResult, World> = (
  value: unknown,
  context: ParameterTransformContext<World>
) => TResult;

export interface ParameterTypeDefinition<World, TResult = unknown> {
  readonly name: string;
  readonly pattern: RegExp | readonly RegExp[];
  readonly primitive?: ParameterPrimitive;
  readonly type?: ConstructorOrFactory<unknown>;
  readonly transform?: ParameterTransformer<TResult, World>;
  readonly useForSnippets?: boolean;
  readonly preferForRegexpMatch?: boolean;
}

export type ParameterTypeDefinitions<World> = ReadonlyArray<
  ParameterTypeDefinition<World>
>;

function toPatternArray(pattern: RegExp | readonly RegExp[]) {
  return Array.isArray(pattern) ? [...pattern] : [pattern];
}

function convertPrimitive(
  value: unknown,
  primitive: ParameterPrimitive
): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => convertPrimitive(item, primitive));
  }

  const text = String(value);

  if (primitive === String) {
    return text;
  }

  if (primitive === Number) {
    const result = Number(text);
    return Number.isNaN(result) ? text : result;
  }

  if (primitive === Boolean) {
    return text.toLowerCase() === "true";
  }

  if (primitive === BigInt) {
    return BigInt(text);
  }

  if (primitive === Date) {
    return new Date(text);
  }

  return primitive(text as never);
}

function isConstructor<T>(
  value: ConstructorOrFactory<T>
): value is Constructor<T> {
  return typeof value === "function" && value.prototype !== undefined;
}

function resolvePrimitiveTarget(
  primitive?: ParameterPrimitive
): ConstructorOrFactory<unknown> | null {
  if (!primitive) {
    return null;
  }

  if (primitive === BigInt) {
    return null;
  }

  return primitive as ConstructorOrFactory<unknown>;
}

function buildDefaultValue(rawValues: readonly string[]): unknown {
  if (rawValues.length === 0) {
    return undefined;
  }

  if (rawValues.length === 1) {
    return rawValues[0];
  }

  return [...rawValues];
}

function buildTransform<World>(
  definition: ParameterTypeDefinition<World>
): ParameterTransformFn<World> {
  return (values: readonly string[] | null, world: World) => {
    const rawValues = values ?? [];
    let resolved = buildDefaultValue(rawValues);

    if (definition.primitive) {
      resolved = convertPrimitive(resolved, definition.primitive);
    }

    if (
      definition.type &&
      !Array.isArray(resolved) &&
      isConstructor(definition.type)
    ) {
      const TypeCtor = definition.type;
      resolved = new TypeCtor(resolved as never);
    }

    if (definition.transform) {
      return definition.transform(resolved, { raw: rawValues, world });
    }

    return resolved;
  };
}

export interface DefineParameterTypeFn<World> {
  (
    registry: ParameterTypeRegistry,
    definition: ParameterTypeDefinition<World>
  ): ParameterType<unknown>;
  many(
    registry: ParameterTypeRegistry,
    ...definitions:
      | ParameterTypeDefinitions<World>
      | [ParameterTypeDefinition<World>]
  ): ParameterTypeRegistry;
}

export function createParameterTypes<World>(): DefineParameterTypeFn<World> {
  applyCucumberExtensions();

  const define = ((
    registry: ParameterTypeRegistry,
    definition: ParameterTypeDefinition<World>
  ) => {
    const patterns = toPatternArray(definition.pattern);
    const transform = buildTransform(definition);
    const parameterTarget =
      definition.type ?? resolvePrimitiveTarget(definition.primitive);

    const parameterType = new ParameterType<unknown>(
      definition.name,
      patterns,
      parameterTarget,
      // The original transform is overridden by applyCucumberExtensions.
      (...matches: string[]) => (matches.length <= 1 ? matches[0] : matches),
      definition.useForSnippets,
      definition.preferForRegexpMatch
    );

    attachTransform(parameterType, transform);
    registry.defineParameterType(parameterType);
    return parameterType;
  }) as DefineParameterTypeFn<World>;

  define.many = (
    registry: ParameterTypeRegistry,
    ...definitions:
      | ParameterTypeDefinitions<World>
      | [ParameterTypeDefinition<World>]
  ) => {
    const list =
      definitions.length === 1 && Array.isArray(definitions[0])
        ? (definitions[0] as ParameterTypeDefinitions<World>)
        : (definitions as ParameterTypeDefinition<World>[]);

    list.forEach((definition) => {
      define(registry, definition);
    });

    return registry;
  };

  return define;
}

export const defineParameterType = createParameterTypes<unknown>();
