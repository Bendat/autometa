import { describe, expect, it } from "vitest";
import { ParameterTypeRegistry, Argument } from "@cucumber/cucumber-expressions";
import {
  createParameterTypes,
  defineParameterType,
} from "../parameter-types";
import type { ParameterTypeDefinitions } from "../parameter-types";

describe("createParameterTypes", () => {
  it("passes the supplied world to custom transforms", () => {
    const registry = new ParameterTypeRegistry();
    const define = createParameterTypes<{ greeting: string }>();

    define(registry, {
      name: "hello",
      pattern: /hello (.*)/,
      transform: (value, context) => `${context.world.greeting}, ${value}`,
    });

    const parameterType = registry.lookupByTypeName("hello");
    expect(parameterType).toBeDefined();
    if (!parameterType) {
      throw new Error("Parameter type 'hello' was not registered");
    }

    const result = parameterType.transform({ greeting: "Hi" }, ["Ben"]);
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
