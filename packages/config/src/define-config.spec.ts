import { describe, it, expect } from "vitest";
import { defineConfig } from "./define-config";
import { Config } from "./config-object";

describe("defineConfig", () => {
  it("should get a default environment that is explicitly defined", () => {
    const config = new Config(new Map());
    defineConfig(config, {
      runner: "jest",
      environment: "default"
    });
    expect(config.current?.environment).toBe("default");
  });
  it("should get a default environment that is implicitly defined", () => {
    const config = new Config(new Map());
    defineConfig(config, {
      runner: "jest"
    });
    expect(config.current?.environment).toBe("default");
  });
  it("should get an environment by literal", () => {
    const config = new Config(new Map());
    defineConfig(config, {
      runner: "jest",
      environment: "foo"
    }).env.byLiteral("foo");
    expect(config.current?.environment).toBe("foo");
  });
  it("should get an environment by environment variable", () => {
    const config = new Config(new Map());
    defineConfig(config, {
      runner: "jest",
      environment: "foo"
    }).env.byEnvironmentVariable("MY_ENVIRONMENT");
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env.MY_ENVIRONMENT = "foo";
    expect(config.current?.environment).toBe("foo");
  });
  it("should get an environment by factory", () => {
    const config = new Config(new Map());
    defineConfig(config, {
      runner: "jest",
      environment: "foo"
    }).env.byFactory(() => "foo");
    expect(config.current?.environment).toBe("foo");
  });
  it("should throw an error if an environment is defined more than once", () => {
    const config = new Config(new Map());
    expect(() =>
      defineConfig(
        config,
        {
          runner: "jest",
          environment: "foo"
        },
        {
          runner: "jest",
          environment: "foo"
        }
      )
    ).toThrow();
    
  });
  it('should throw an error if an implicit and explicit default is defined', ()=>{
    const config = new Config(new Map());
    expect(() =>
      defineConfig(
        config,
        {
          runner: "jest",
          environment: "default"
        },
        {
          runner: "jest"
        }
      )
    ).toThrow();
  })
});
