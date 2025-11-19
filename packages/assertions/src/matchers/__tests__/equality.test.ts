import { describe, expect, it } from "vitest";

import { TestMatcherError, createMatcherContext } from "../../__tests__/helpers/matcher-context";
import { assertToBe, assertToEqual, assertToStrictEqual } from "../equality";

function extractMessage(error: unknown): string {
  if (error instanceof TestMatcherError) {
    return error.details.message;
  }
  throw error;
}

describe("equality matchers", () => {
  describe("assertToBe", () => {
    it("passes when values are strictly equal", () => {
      const ctx = createMatcherContext({ id: 1 });
      expect(() => assertToBe(ctx, ctx.value)).not.toThrow();
    });

    it("fails with descriptive message when values differ", () => {
      const ctx = createMatcherContext({ id: 1 });
      try {
        assertToBe(ctx, { id: 1 });
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(TestMatcherError);
        const failure = error as TestMatcherError;
        expect(failure.matcher).toBe("toBe");
        expect(failure.details.expected).toEqual({ id: 1 });
        expect(failure.details.actual).toBe(ctx.value);
        expect(failure.details.message).toContain("ensure(received).toBe(expected)");
      }
    });

    it("honors negated expectation", () => {
      const ctx = createMatcherContext(3, { negated: true });
      expect(() => assertToBe(ctx, 4)).not.toThrow();
      expect(() => assertToBe(ctx, 3)).toThrowError(TestMatcherError);
    });
  });

  describe("assertToEqual", () => {
    it("passes for deep equal structures", () => {
      const ctx = createMatcherContext({ nested: { values: [1, 2, 3] } });
      expect(() => assertToEqual(ctx, { nested: { values: [1, 2, 3] } })).not.toThrow();
    });

    it("fails when deep equality check fails", () => {
      const ctx = createMatcherContext({ nested: { values: [1, 2, 3] } });
      try {
        assertToEqual(ctx, { nested: { values: [3, 2, 1] } });
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(TestMatcherError);
        expect((error as TestMatcherError).matcher).toBe("toEqual");
        expect((error as TestMatcherError).details.message).toContain("deeply equal");
      }
    });

    it("uses negation to expect inequality", () => {
      const ctx = createMatcherContext({ id: 1 }, { negated: true });
      expect(() => assertToEqual(ctx, { id: 2 })).not.toThrow();
      expect(() => assertToEqual(ctx, { id: 1 })).toThrowError(TestMatcherError);
    });
  });

  describe("assertToStrictEqual", () => {
    it("passes when values are strictly equal", () => {
      const ctx = createMatcherContext({ id: 1, flag: true });
      expect(() => assertToStrictEqual(ctx, { id: 1, flag: true })).not.toThrow();
    });

    it("captures prototype differences", () => {
      class Parent {
        public readonly id = 1;
      }
      class Child extends Parent {
        public readonly child = true;
      }
      const ctx = createMatcherContext(new Parent());
      expect(() => assertToStrictEqual(ctx, new Child())).toThrowError(TestMatcherError);
      expect(() => assertToStrictEqual(createMatcherContext(new Child()), new Child())).not.toThrow();
    });

    it("includes formatted diff in failure message", () => {
      const ctx = createMatcherContext({ id: 1 });
      try {
        assertToStrictEqual(ctx, { id: 2 });
      } catch (error) {
        expect(error).toBeInstanceOf(TestMatcherError);
        const message = extractMessage(error);
        expect(message).toContain("ensure(received).toStrictEqual(expected)");
        expect(message).toContain("Expected values to be strictly equal");
      }
    });
  });
});
