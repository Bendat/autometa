import { describe, expect, it } from "vitest";

import { TestMatcherError, createMatcherContext } from "../../__tests__/helpers/matcher-context";
import { assertToBeDefined, assertToBeNull, assertToBeUndefined } from "../nullish";

describe("nullish matchers", () => {
  describe("assertToBeDefined", () => {
    it("narrows value when defined", () => {
      const ctx = createMatcherContext<string | undefined>("defined");
      const result = assertToBeDefined(ctx);
      const expectsString: string = result;
      expect(expectsString).toBe("defined");
    });

    it("fails when value is null", () => {
      const ctx = createMatcherContext<string | null>(null);
      expect(() => assertToBeDefined(ctx)).toThrowError(TestMatcherError);
    });

    it("respects negated expectation", () => {
      const undefinedCtx = createMatcherContext<string | undefined>(undefined, { negated: true });
      expect(() => assertToBeDefined(undefinedCtx)).not.toThrow();
      const definedCtx = createMatcherContext<string | undefined>("value", { negated: true });
      expect(() => assertToBeDefined(definedCtx)).toThrowError(TestMatcherError);
    });
  });

  describe("assertToBeUndefined", () => {
    it("passes when value is undefined", () => {
      const ctx = createMatcherContext<string | undefined>(undefined);
      expect(() => assertToBeUndefined(ctx)).not.toThrow();
    });

    it("fails when value is defined", () => {
      const ctx = createMatcherContext("value");
      expect(() => assertToBeUndefined(ctx)).toThrowError(TestMatcherError);
    });

    it("respects negation", () => {
      const ctx = createMatcherContext<string | undefined>(undefined, { negated: true });
      expect(() => assertToBeUndefined(ctx)).toThrowError(TestMatcherError);
    });
  });

  describe("assertToBeNull", () => {
    it("passes for null values", () => {
      const ctx = createMatcherContext<null | number>(null);
      expect(() => assertToBeNull(ctx)).not.toThrow();
    });

    it("fails for defined values", () => {
      const ctx = createMatcherContext<null | number>(42);
      expect(() => assertToBeNull(ctx)).toThrowError(TestMatcherError);
    });

    it("respects negation rule", () => {
      const ctx = createMatcherContext<null | number>(null, { negated: true });
      expect(() => assertToBeNull(ctx)).toThrowError(TestMatcherError);
    });
  });
});
