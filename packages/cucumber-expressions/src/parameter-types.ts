import {
  ParameterType,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { attachTransform, applyCucumberExtensions } from "./extensions";
import type { ParameterRuntime, ParameterTransformFn } from "./extensions";

export interface CreateParameterTypesOptions {
  readonly namespace?: string;
}

export interface ParameterTransformContext<World> {
  readonly raw: readonly string[];
  readonly world: World;
  readonly name: string | undefined;
  readonly originalName: string | undefined;
  readonly namespace?: string;
  readonly parameterType: ParameterType<unknown>;
  readonly definition: ParameterTypeDefinition<World>;
}

export type ParameterTransformer<TResult, World> = (
  value: unknown,
  context: ParameterTransformContext<World>
) => TResult | Promise<TResult>;

export interface ParameterTypeDefinition<World, TResult = unknown> {
  readonly name: string;
  readonly pattern: RegExp | readonly RegExp[];
  readonly transform?: ParameterTransformer<TResult, World>;
  readonly useForSnippets?: boolean;
  readonly preferForRegexpMatch?: boolean;
  readonly builtin?: boolean;
}

export type ParameterTypeDefinitions<World> = ReadonlyArray<
  ParameterTypeDefinition<World>
>;

function toPatternArray(pattern: RegExp | readonly RegExp[]) {
  return Array.isArray(pattern) ? [...pattern] : [pattern];
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

function resolveScopedName(name: string, namespace: string | undefined) {
  if (!name || !namespace) {
    return name;
  }

  return `${namespace}:${name}`;
}

function buildTransform<World>(
  definition: ParameterTypeDefinition<World>,
  scopedName: string,
  options: CreateParameterTypesOptions | undefined
): ParameterTransformFn<World> {
  return (values: readonly string[] | null, runtime: ParameterRuntime<World>) => {
    const rawValues = values ?? [];
    const resolved = buildDefaultValue(rawValues);

    if (definition.transform) {
      const context: ParameterTransformContext<World> = {
        raw: rawValues,
        world: runtime.world,
        name: scopedName,
        originalName: definition.name,
        parameterType: runtime.parameterType,
        definition,
        ...(options?.namespace !== undefined
          ? { namespace: options.namespace }
          : {}),
      };

      return definition.transform(resolved, context);
    }

    return resolved;
  };
}

function firstValue<T>(input: unknown): T | undefined {
  return Array.isArray(input) ? (input[0] as T | undefined) : (input as T | undefined);
}

function firstString(input: unknown): string | undefined {
  const value = firstValue<unknown>(input);
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

function parseNumberValue(
  input: unknown,
  parser: (raw: string) => number
): number | null {
  const raw = firstString(input);
  if (raw === undefined) {
    return null;
  }

  const numeric = parser(raw);
  return Number.isNaN(numeric) ? null : numeric;
}

function parseBigIntValue(input: unknown): bigint | null {
  const raw = firstString(input);
  if (raw === undefined) {
    return null;
  }

  try {
    return BigInt(raw);
  } catch {
    return null;
  }
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

export function createParameterTypes<World>(
  options?: CreateParameterTypesOptions
): DefineParameterTypeFn<World> {
  applyCucumberExtensions();

  const define = ((
    registry: ParameterTypeRegistry,
    definition: ParameterTypeDefinition<World>
  ) => {
    const patterns = toPatternArray(definition.pattern);
    const scopedName = resolveScopedName(definition.name, options?.namespace);
    const transform = buildTransform(definition, scopedName, options);
    const parameterType = new ParameterType<unknown>(
      scopedName,
      patterns,
      null,
      // The original transform is overridden by applyCucumberExtensions.
      (...matches: string[]) => (matches.length <= 1 ? matches[0] : matches),
      definition.useForSnippets,
      definition.preferForRegexpMatch,
      definition.builtin
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

const INTEGER_REGEXPS = [/-?\d+/, /\d+/] as const;
const FLOAT_REGEXP = /(?=.*\d.*)[-+]?\d*(?:\.(?=\d.*))?\d*(?:\d+[E][+-]?\d+)?/;
const WORD_REGEXP = /[^\s]+/;
const STRING_REGEXP = /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'/;
const ANONYMOUS_REGEXP = /.*/;

export function createDefaultParameterTypes<World>(
  options?: CreateParameterTypesOptions
) {
  const define = createParameterTypes<World>(options);

  return (registry: ParameterTypeRegistry) => {
    const defaults: ParameterTypeDefinition<World>[] = [
      {
        name: "int",
        pattern: INTEGER_REGEXPS,
        transform: (value: unknown) =>
          parseNumberValue(value, (raw) => parseInt(raw, 10)),
        useForSnippets: true,
        preferForRegexpMatch: true,
        builtin: true,
      },
      {
        name: "float",
        pattern: FLOAT_REGEXP,
        transform: (value: unknown) =>
          parseNumberValue(value, (raw) => parseFloat(raw)),
        useForSnippets: true,
        preferForRegexpMatch: false,
        builtin: true,
      },
      {
        name: "number",
        pattern: FLOAT_REGEXP,
        transform: (value: unknown) =>
          parseNumberValue(value, (raw) => parseFloat(raw)),
        useForSnippets: true,
        preferForRegexpMatch: false,
        builtin: true,
      },
      {
        name: "word",
        pattern: WORD_REGEXP,
        transform: (value: unknown) => firstString(value) ?? "",
        useForSnippets: false,
        preferForRegexpMatch: false,
        builtin: true,
      },
      {
        name: "string",
        pattern: STRING_REGEXP,
        transform: (_value: unknown, context: ParameterTransformContext<World>) => {
          const [doubleQuoted, singleQuoted] = context.raw;
          const captured = doubleQuoted ?? singleQuoted ?? "";
          return captured
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'");
        },
        useForSnippets: true,
        preferForRegexpMatch: false,
        builtin: true,
      },
      {
        name: "",
        pattern: ANONYMOUS_REGEXP,
        transform: (_value: unknown, context: ParameterTransformContext<World>) =>
          context.raw[0] ?? "",
        useForSnippets: false,
        preferForRegexpMatch: true,
        builtin: true,
      },
      {
        name: "double",
        pattern: FLOAT_REGEXP,
        transform: (value: unknown) =>
          parseNumberValue(value, (raw) => parseFloat(raw)),
        useForSnippets: false,
        preferForRegexpMatch: false,
        builtin: true,
      },
      {
        name: "bigdecimal",
        pattern: FLOAT_REGEXP,
        transform: (value: unknown) => {
          const text = firstString(value);
          return text ?? null;
        },
        useForSnippets: false,
        preferForRegexpMatch: false,
        builtin: true,
      },
      {
        name: "byte",
        pattern: INTEGER_REGEXPS,
        transform: (value: unknown) =>
          parseNumberValue(value, (raw) => parseInt(raw, 10)),
        useForSnippets: false,
        preferForRegexpMatch: false,
        builtin: true,
      },
      {
        name: "short",
        pattern: INTEGER_REGEXPS,
        transform: (value: unknown) =>
          parseNumberValue(value, (raw) => parseInt(raw, 10)),
        useForSnippets: false,
        preferForRegexpMatch: false,
        builtin: true,
      },
      {
        name: "long",
        pattern: INTEGER_REGEXPS,
        transform: (value: unknown) =>
          parseNumberValue(value, (raw) => parseInt(raw, 10)),
        useForSnippets: false,
        preferForRegexpMatch: false,
        builtin: true,
      },
      {
        name: "biginteger",
        pattern: INTEGER_REGEXPS,
        transform: (value: unknown) => parseBigIntValue(value),
        useForSnippets: false,
        preferForRegexpMatch: false,
        builtin: true,
      },
    ];

    const prepared = defaults.map((definition) =>
      options?.namespace && definition.preferForRegexpMatch
        ? { ...definition, preferForRegexpMatch: false }
        : definition
    );

    const toRegister: ParameterTypeDefinition<World>[] = [];

    prepared.forEach((definition) => {
      const scopedName = resolveScopedName(
        definition.name,
        options?.namespace
      );
      const existing = registry.lookupByTypeName(scopedName);

      if (existing) {
        const transform = buildTransform(definition, scopedName, options);
        attachTransform(existing, transform);
        return;
      }

      toRegister.push(definition);
    });

    if (toRegister.length > 0) {
      define.many(registry, ...toRegister);
    }

    return registry;
  };
}

export const defineDefaultParameterTypes =
  createDefaultParameterTypes<unknown>();
