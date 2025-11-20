import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { AutomationError } from "@autometa/errors";

import { defineConfig } from "../config";

const createDefaultConfig = () => ({
  runner: "vitest" as const,
  roots: {
    features: ["features"],
    steps: ["steps"],
  },
});

describe("defineConfig", () => {
  const originalEnv = process.env.TEST_ENV;

  beforeEach(() => {
    delete process.env.TEST_ENV;
  });

  afterEach(() => {
    process.env.TEST_ENV = originalEnv;
  });

  it("resolves the default environment when no detectors are provided", () => {
    const config = defineConfig({
      default: createDefaultConfig(),
    });

    const resolved = config.resolve();

    expect(resolved.environment).toBe("default");
    expect(resolved.config.runner).toBe("vitest");
    expect(resolved.config.roots.features).toEqual(["features"]);
  });

  it("merges environment overrides when detectors select them", () => {
    const config = defineConfig({
      default: createDefaultConfig(),
      environments: {
        ci: {
          test: {
            timeout: { value: 30, unit: "s" },
          },
          roots: {
            features: ["ci/features"],
            steps: ["ci/steps"],
          },
        },
      },
      environment: (env) => env.byLiteral("ci"),
    });

    const resolved = config.resolve();

    expect(resolved.environment).toBe("ci");
    expect(resolved.config.test?.timeout).toEqual({ value: 30, unit: "s" });
    expect(resolved.config.roots.features).toEqual(["ci/features"]);
    expect(resolved.config.roots.steps).toEqual(["ci/steps"]);
  });

  it("honours explicit resolve overrides", () => {
    const config = defineConfig({
      default: createDefaultConfig(),
      environments: {
        qa: {
          events: ["qa"],
        },
      },
    });

    const resolved = config.resolve({ environment: "qa" });

    expect(resolved.environment).toBe("qa");
    expect(resolved.config.events).toEqual(["qa"]);
  });

  it("throws when requesting an unknown environment", () => {
    const config = defineConfig({
      default: createDefaultConfig(),
    });

    expect(() => config.forEnvironment("qa")).toThrowError(AutomationError);
  });

  it("detects environments via process environment variables", () => {
    const config = defineConfig({
      default: createDefaultConfig(),
      environments: {
        staging: {
          roots: {
            features: ["staging/features"],
            steps: ["staging/steps"],
          },
        },
      },
      environment: (env) => env.byEnvironmentVariable("TEST_ENV"),
    });

    process.env.TEST_ENV = "staging";
    const resolved = config.resolve();

    expect(resolved.environment).toBe("staging");
    expect(resolved.config.roots.features).toEqual(["staging/features"]);
  });

  it("returns deeply frozen configuration objects", () => {
    const config = defineConfig({
      default: createDefaultConfig(),
    });

    const { config: resolved } = config.resolve();

    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.roots.features)).toBe(true);
    expect(() => {
      resolved.roots.features.push("new");
    }).toThrow();
  });

  it("merges reporter buffering preferences", () => {
    const config = defineConfig({
      default: {
        ...createDefaultConfig(),
        reporting: {
          hierarchical: {
            bufferOutput: true,
          },
        },
      },
      environments: {
        ci: {
          reporting: {
            hierarchical: {
              bufferOutput: false,
            },
          },
        },
      },
      environment: (env) => env.byLiteral("ci"),
    });

    const ciResolved = config.resolve();
    expect(ciResolved.config.reporting?.hierarchical?.bufferOutput).toBe(false);

    const defaultResolved = config.resolve({ environment: "default" });
    expect(defaultResolved.config.reporting?.hierarchical?.bufferOutput).toBe(true);
  });
});
