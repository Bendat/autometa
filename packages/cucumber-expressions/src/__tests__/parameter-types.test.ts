import { describe, expect, it } from "vitest";
import { ParameterTypeRegistry, Argument } from "@cucumber/cucumber-expressions";
import {
  createParameterTypes,
  defineParameterType,
  createDefaultParameterTypes,
  defineDefaultParameterTypes,
} from "../parameter-types";
import type { ParameterTypeDefinitions } from "../parameter-types";
import type { ParameterTransformContext } from "../parameter-types";
import { applyCucumberExtensions, resetCucumberExtensions } from "../extensions";

describe("createParameterTypes", () => {
  it("passes the supplied world and metadata to custom transforms", () => {
    const registry = new ParameterTypeRegistry();
    const define = createParameterTypes<{ greeting: string }>();
    let capturedContext: ParameterTransformContext<{ greeting: string }> | undefined;

    define(registry, {
      name: "hello",
      pattern: /hello (.*)/,
      transform: (value, context) => {
        capturedContext = context;
        return `${context.world.greeting}, ${value}`;
      },
    });

    const parameterType = registry.lookupByTypeName("hello");
    expect(parameterType).toBeDefined();
    if (!parameterType) {
      throw new Error("Parameter type 'hello' was not registered");
    }

    const result = parameterType.transform({ greeting: "Hi" }, ["Ben"]);
    expect(result).toBe("Hi, Ben");
    expect(capturedContext).toBeDefined();
    if (!capturedContext) {
      throw new Error("Context should be captured");
    }

    expect(capturedContext.raw).toEqual(["Ben"]);
    expect(capturedContext.world).toEqual({ greeting: "Hi" });
    expect(capturedContext.name).toBe("hello");
    expect(capturedContext.originalName).toBe("hello");
    expect(capturedContext.namespace).toBeUndefined();
    expect(capturedContext.parameterType).toBe(parameterType);
    expect(capturedContext.definition.name).toBe("hello");
  });

  it("supports async parameter transforms", async () => {
    const registry = new ParameterTypeRegistry();
    const define = createParameterTypes<{ greeting: string }>();

    define(registry, {
      name: "async",
      pattern: /hello (.*)/,
      transform: async (value, context) => {
        await Promise.resolve();
        return `${context.world.greeting}, ${value}`;
      },
    });

    const parameterType = registry.lookupByTypeName("async");
    expect(parameterType).toBeDefined();
    if (!parameterType) {
      throw new Error("Parameter type 'async' was not registered");
    }

    const result = await parameterType.transform({ greeting: "Hi" }, ["Ben"]);
    expect(result).toBe("Hi, Ben");
  });

  it("applies primitive coercions before user transforms", () => {
    const registry = new ParameterTypeRegistry();
    const define = createParameterTypes<{ base: number }>();

    define(registry, {
      name: "integer",
      pattern: /(-?\d+)/,
      primitive: Number,
      transform: (value) => value,
    });

    const parameterType = registry.lookupByTypeName("integer");
    expect(parameterType).toBeDefined();
    if (!parameterType) {
      throw new Error("Parameter type 'integer' was not registered");
    }

    const coerced = parameterType.transform({}, ["42"]);
    expect(coerced).toBe(42);
  });

  it("allows registering multiple parameter types in one call", () => {
    const registry = new ParameterTypeRegistry();
    const define = createParameterTypes<unknown>();

    const definitions: ParameterTypeDefinitions<unknown> = [
      { name: "customWord", pattern: /(\w+)/ },
      { name: "customNumber", pattern: /(-?\d+)/, primitive: Number },
    ];

    define.many(registry, ...definitions);

    expect(registry.lookupByTypeName("customWord")).toBeDefined();
    expect(registry.lookupByTypeName("customNumber")).toBeDefined();
  });

  it("scopes parameter names when a namespace is provided", () => {
    const registry = new ParameterTypeRegistry();
    const define = createParameterTypes<{ greeting: string }>({
      namespace: "core",
    });
    let capturedContext: ParameterTransformContext<{ greeting: string }> | undefined;

    define(registry, {
      name: "hello",
      pattern: /hello (.*)/,
      transform: (value, context) => {
        capturedContext = context;
        return `${context.world.greeting}, ${value}`;
      },
    });

    const parameterType = registry.lookupByTypeName("core:hello");
    expect(parameterType).toBeDefined();
    if (!parameterType) {
      throw new Error("Namespaced parameter type was not registered");
    }

    parameterType.transform({ greeting: "Hi" }, ["Ben"]);
    expect(capturedContext?.name).toBe("core:hello");
    expect(capturedContext?.originalName).toBe("hello");
    expect(capturedContext?.namespace).toBe("core");
  });
});

describe("defineParameterType default export", () => {
  it("remains compatible with Cucumber Argument#getValue", () => {
    const registry = new ParameterTypeRegistry();

    defineParameterType(registry, {
      name: "shout",
      pattern: /(.*)/,
      transform: (value, context) => `${value}! (${String(context.world)})`,
    });

    const parameterType = registry.lookupByTypeName("shout");
    expect(parameterType).toBeDefined();
    if (!parameterType) {
      throw new Error("Parameter type 'shout' was not registered");
    }

    const group = {
      value: "hello",
      start: 0,
      end: 5,
      children: [] as unknown[],
      values: ["hello"],
    };

    const argument = new Argument(group as never, parameterType);

    const world = "world";
    const transformed = argument.getValue(world);

    expect(transformed).toBe("hello! (world)");
  });
});

describe("default parameter types", () => {
  it("registers the built-in cucumber defaults", () => {
    const registry = new ParameterTypeRegistry();
    const registerDefaults = createDefaultParameterTypes<unknown>();

    registerDefaults(registry);

    const intType = registry.lookupByTypeName("int");
    const stringType = registry.lookupByTypeName("string");
    const anonymousType = registry.lookupByTypeName("");

  expect(intType?.transform({}, ["5"])).toBe(5);
  expect(stringType?.transform({}, ["hello"])).toBe("hello");
    expect(anonymousType?.transform({}, ["value"])).toBe("value");
  });

  it("supports namespacing when registering defaults", () => {
    const registry = new ParameterTypeRegistry();
    const registerDefaults = createDefaultParameterTypes<unknown>({
      namespace: "core",
    });

    registerDefaults(registry);

    expect(registry.lookupByTypeName("core:int")).toBeDefined();
    expect(registry.lookupByTypeName("core:string")).toBeDefined();

    defineDefaultParameterTypes(registry);
    expect(registry.lookupByTypeName("int")).toBeDefined();
  });
});

describe("extension lifecycle", () => {
  it("resetCucumberExtensions restores vanilla behaviour", () => {
    const registry = new ParameterTypeRegistry();
    const define = createParameterTypes<string>();

    define(registry, {
      name: "reset",
      pattern: /(.*)/,
      transform: (value, context) => `${context.world}:${value}`,
    });

    const parameterType = registry.lookupByTypeName("reset");
    expect(parameterType).toBeDefined();
    if (!parameterType) {
      throw new Error("Parameter type 'reset' was not registered");
    }

    const transformed = parameterType.transform("world", ["value"]);
    expect(transformed).toBe("world:value");

    resetCucumberExtensions();

    const fallback = parameterType.transform("world", ["value"]);
    expect(fallback).toBe("value");

    applyCucumberExtensions();
  });
});
