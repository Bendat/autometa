import { describe, expect, it } from "vitest";

import { TestMatcherError, createMatcherContext } from "../../__tests__/helpers/matcher-context";
import { assertToBeFalsy, assertToBeTruthy } from "../truthiness";

describe("truthiness matchers", () => {
  describe("assertToBeTruthy", () => {
    it("passes for truthy values", () => {
      const ctx = createMatcherContext("value");
      expect(() => assertToBeTruthy(ctx)).not.toThrow();
    });

    it("fails for falsy values", () => {
      const ctx = createMatcherContext(0);
      expect(() => assertToBeTruthy(ctx)).toThrowError(TestMatcherError);
    });

    it("supports negated expectation", () => {
      const ctx = createMatcherContext(0, { negated: true });
      expect(() => assertToBeTruthy(ctx)).not.toThrow();
      expect(() => assertToBeTruthy(createMatcherContext(1, { negated: true }))).toThrowError(
        TestMatcherError
      );
    });
  });

  describe("assertToBeFalsy", () => {
    it("passes for falsy values", () => {
      const ctx = createMatcherContext(0);
      expect(() => assertToBeFalsy(ctx)).not.toThrow();
    });

    it("fails for truthy values", () => {
      const ctx = createMatcherContext(1);
      expect(() => assertToBeFalsy(ctx)).toThrowError(TestMatcherError);
    });

    it("supports negated expectation", () => {
      const ctx = createMatcherContext("value", { negated: true });
      expect(() => assertToBeFalsy(ctx)).not.toThrow();
      expect(() => assertToBeFalsy(createMatcherContext("value"))).toThrowError(TestMatcherError);
    });
  });
});
