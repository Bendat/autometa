import { describe, expect, it } from "vitest";
import { withErrorBoundary } from "../error-boundary.js";
import { AutomationError } from "@autometa/errors";

class ExplosiveFixture {
  explode() {
    throw new Error("boom");
  }

  async asyncExplode() {
    throw new Error("kaboom");
  }
}

describe("withErrorBoundary", () => {
  it("wraps synchronous methods", () => {
    const fixture = withErrorBoundary(new ExplosiveFixture());

    expect(() => fixture.explode()).toThrowError(AutomationError);
    try {
      fixture.explode();
    } catch (error) {
      const message = (error as AutomationError).message;
      expect(message).toMatch(/ExplosiveFixture\.explode/);
      expect((error as AutomationError).cause).toBeInstanceOf(Error);
    }
  });

  it("wraps asynchronous methods", async () => {
    const fixture = withErrorBoundary(new ExplosiveFixture());

    await expect(fixture.asyncExplode()).rejects.toThrowError(AutomationError);
  });

  it("supports custom formatters", () => {
    const fixture = withErrorBoundary(new ExplosiveFixture(), {
      formatMessage: ({ method }) => `Failure in ${String(method)}`,
    });

    expect(() => fixture.explode()).toThrowError(/Failure in explode/);
  });
});
