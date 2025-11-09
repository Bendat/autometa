import { describe, expect, it } from "vitest";
import { FixtureProxy, createFixtureProxy } from "../fixture-proxy.js";

class Calculator {
  total = 0;

  add(value: number) {
    this.total += value;
    return this.total;
  }
}

describe("createFixtureProxy", () => {
  it("wraps fixtures with access tracking and error boundary", () => {
    const { value } = createFixtureProxy(new Calculator());

    value.add(5);
  expect(FixtureProxy.reads(value, "total")).toBe(3);
    expect(FixtureProxy.writes(value, "total")).toEqual([0, 5]);

    expect(() => (value as Calculator & { ttl: number }).ttl).toThrow(
      /Did you mean:/
    );
  });

  it("allows disabling features individually", () => {
    const original = new Calculator();
    const { value } = createFixtureProxy(original, {
      access: false,
      errors: false,
    });

    expect(value).toBe(original);
  });
});
