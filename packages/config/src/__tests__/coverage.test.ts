import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { EnvironmentSelector } from "../environment-selector";
import { defineConfig } from "../config";

describe("EnvironmentSelector coverage", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars
    delete process.env.TEST_ENV;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  it("sanitizes null values to undefined", () => {
    const selector = new EnvironmentSelector();
    const factory = () => null as any;

    selector.byFactory(factory);
    const result = selector.resolve();

    // Should fall back to default since null is sanitized to undefined
    expect(result).toBe("default");
  });

  it("sanitizes undefined values", () => {
    const selector = new EnvironmentSelector();
    const factory = () => undefined;

    selector.byFactory(factory);
    const result = selector.resolve();

    expect(result).toBe("default");
  });

  it("sanitizes empty strings to undefined", () => {
    const selector = new EnvironmentSelector();
    selector.byFactory(() => "   ");

    const result = selector.resolve();
    expect(result).toBe("default");
  });

  it("supports byFactory with custom detection logic", () => {
    const selector = new EnvironmentSelector();
    selector.byFactory(() => "custom-env");

    const result = selector.resolve();
    expect(result).toBe("custom-env");
  });

  it("throws when defaultTo is called with empty string", () => {
    const selector = new EnvironmentSelector();

    expect(() => selector.defaultTo("")).toThrow("Default environment name must be a non-empty string");
  });

  it("throws when defaultTo is called with whitespace only", () => {
    const selector = new EnvironmentSelector();

    expect(() => selector.defaultTo("   ")).toThrow("Default environment name must be a non-empty string");
  });

  it("throws when defaultTo is called with null", () => {
    const selector = new EnvironmentSelector();

    expect(() => selector.defaultTo(null as any)).toThrow("Default environment name must be a non-empty string");
  });

  it("uses custom default when set", () => {
    const selector = new EnvironmentSelector();
    selector.byLiteral("").defaultTo("production");

    const result = selector.resolve();
    expect(result).toBe("production");
  });

  it("chains multiple detection methods and uses first match", () => {
    process.env.TEST_ENV = "";

    const selector = new EnvironmentSelector();
    selector
      .byEnvironmentVariable("TEST_ENV")
      .byFactory(() => "from-factory")
      .byLiteral("from-literal");

    const result = selector.resolve();
    // First detector (env var) returns empty string (sanitized to undefined)
    // Second detector (factory) returns "from-factory"
    expect(result).toBe("from-factory");
  });
});

describe("Config merging edge cases", () => {
  it("merges hierarchical reporting when overridden", () => {
    const config = defineConfig({
      default: {
        runner: "vitest" as const,
        roots: {
          features: ["features"],
          steps: ["steps"],
        },
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

    const resolved = config.resolve();
    expect(resolved.config.reporting?.hierarchical?.bufferOutput).toBe(false);
  });

  it("preserves hierarchical reporting from base when override is empty", () => {
    const config = defineConfig({
      default: {
        runner: "vitest" as const,
        roots: {
          features: ["features"],
          steps: ["steps"],
        },
        reporting: {
          hierarchical: {
            bufferOutput: true,
          },
        },
      },
      environments: {
        test: {
          roots: {
            features: ["test-features"],
            steps: ["test-steps"],
          },
        },
      },
      environment: (env) => env.byLiteral("test"),
    });

    const resolved = config.resolve();
    // Hierarchical config from base should be preserved
    expect(resolved.config.reporting?.hierarchical?.bufferOutput).toBe(true);
  });

  it("preserves required roots from base config", () => {
    const config = defineConfig({
      default: {
        runner: "vitest" as const,
        roots: {
          features: ["features"],
          steps: ["steps"],
        },
      },
      environments: {
        test: {
          roots: {
            fixtures: ["fixtures"],
          },
        },
      },
    });

    const resolved = config.resolve({ environment: "test" });
    // Required roots should still be present from base
    expect(resolved.config.roots.features).toEqual(["features"]);
    expect(resolved.config.roots.steps).toEqual(["steps"]);
    expect(resolved.config.roots.fixtures).toEqual(["fixtures"]);
  });

  it("preserves optional roots when undefined in override", () => {
    const config = defineConfig({
      default: {
        runner: "vitest" as const,
        roots: {
          features: ["features"],
          steps: ["steps"],
          parameterTypes: ["param-types"],
        },
      },
      environments: {
        test: {
          roots: {
            fixtures: ["test-fixtures"],
          },
        },
      },
      environment: (env) => env.byLiteral("test"),
    });

    const resolved = config.resolve();
    expect(resolved.config.roots.parameterTypes).toEqual(["param-types"]);
    expect(resolved.config.roots.fixtures).toEqual(["test-fixtures"]);
  });

  it("merges undefined environment variable values correctly", () => {
    delete process.env.UNDEFINED_VAR;

    const config = defineConfig({
      default: {
        runner: "vitest" as const,
        roots: {
          features: ["features"],
          steps: ["steps"],
        },
      },
      environments: {
        staging: {
          roots: {
            features: ["staging/features"],
            steps: ["staging/steps"],
          },
        },
      },
      environment: (env) => env.byEnvironmentVariable("UNDEFINED_VAR"),
    });

    const resolved = config.resolve();
    // Should use default since env var is undefined
    expect(resolved.environment).toBe("default");
    expect(resolved.config.roots.features).toEqual(["features"]);
  });

  it("handles reporting configuration presence", () => {
    const config = defineConfig({
      default: {
        runner: "vitest" as const,
        roots: {
          features: ["features"],
          steps: ["steps"],
        },
        reporting: {
          hierarchical: {
            bufferOutput: false,
          },
        },
      },
    });

    const resolved = config.resolve();
    expect(resolved.config.reporting).toBeDefined();
    expect(resolved.config.reporting?.hierarchical).toBeDefined();
  });
});

describe("Schema edge cases", () => {
  it("validates minimal valid config", () => {
    const config = defineConfig({
      default: {
        runner: "vitest" as const,
        roots: {
          features: ["f"],
          steps: ["s"],
        },
      },
    });

    const resolved = config.resolve();
    expect(resolved.config.runner).toBe("vitest");
  });

  it("supports all runner types", () => {
    const vitestConfig = defineConfig({
      default: {
        runner: "vitest" as const,
        roots: { features: ["f"], steps: ["s"] },
      },
    });

    const jestConfig = defineConfig({
      default: {
        runner: "jest" as const,
        roots: { features: ["f"], steps: ["s"] },
      },
    });

    const playwrightConfig = defineConfig({
      default: {
        runner: "playwright" as const,
        roots: { features: ["f"], steps: ["s"] },
      },
    });

    expect(vitestConfig.resolve().config.runner).toBe("vitest");
    expect(jestConfig.resolve().config.runner).toBe("jest");
    expect(playwrightConfig.resolve().config.runner).toBe("playwright");
  });

  it("handles complex timeout configurations", () => {
    const config = defineConfig({
      default: {
        runner: "vitest" as const,
        roots: {
          features: ["features"],
          steps: ["steps"],
        },
        test: {
          timeout: {
            value: 5000,
            unit: "ms",
          },
        },
      },
    });

    const resolved = config.resolve();
    expect(resolved.config.test?.timeout).toEqual({ value: 5000, unit: "ms" });
  });

  it("handles events configuration", () => {
    const config = defineConfig({
      default: {
        runner: "vitest" as const,
        roots: {
          features: ["features"],
          steps: ["steps"],
        },
        events: ["events/*.ts", "events/**/*.event.ts"],
      },
    });

    const resolved = config.resolve();
    expect(resolved.config.events).toEqual(["events/*.ts", "events/**/*.event.ts"]);
  });
});
