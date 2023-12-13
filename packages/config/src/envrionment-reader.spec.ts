import { describe, it, expect } from "vitest";
import { EnvironmentReader } from "./environment-reader";
describe("EnvironmentReader", () => {
  it("should return the literal value when only the literal is set", () => {
    const reader = new EnvironmentReader().byLiteral("foo");
    expect(reader.value).toBe("foo");
  });
  it("should return the environment variable value when only the environment variable is set", () => {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env["FOO"] = "bar";
    const reader = new EnvironmentReader().byEnvironmentVariable("FOO");
    expect(reader.value).toBe("bar");
  });

  it("should return the factory value when only the factory is set", () => {
    const reader = new EnvironmentReader().byFactory(() => "foo");
    expect(reader.value).toBe("foo");
  });

  it("should return the literal value when the literal and environment variable are set", () => {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env["FOO"] = "bar";
    const reader = new EnvironmentReader()
      .byLiteral("foo")
      .byEnvironmentVariable("FOO");
    expect(reader.value).toBe("foo");
  });

  it("should return the literal value when the literal and factory are set", () => {
    const reader = new EnvironmentReader()
      .byLiteral("foo")
      .byFactory(() => "bar");
    expect(reader.value).toBe("foo");
  });

  it("should return the environment variable value when the environment variable and factory are set", () => {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env["FOO"] = "bar";
    const reader = new EnvironmentReader()
      .byEnvironmentVariable("FOO")
      .byFactory(() => "bar");
    expect(reader.value).toBe("bar");
  });

  it("should return the literal value when the literal, environment variable, and factory are set", () => {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env["FOO"] = "bar";
    const reader = new EnvironmentReader()
      .byLiteral("foo")
      .byEnvironmentVariable("FOO")
      .byFactory(() => "bar");
    expect(reader.value).toBe("foo");
  });
});
