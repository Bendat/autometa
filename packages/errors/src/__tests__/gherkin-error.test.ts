import { describe, expect, it } from "vitest";
import {
  GherkinStepError,
  getGherkinErrorContext,
  isGherkinStepError,
  type GherkinErrorContext,
} from "../gherkin-error";

const baseContext: GherkinErrorContext = {
  gherkin: {
    featureName: "Coffee feature",
    stepKeyword: "Given",
    stepText: "a brewed beverage",
    location: {
      filePath: "/features/coffee.feature",
      start: { line: 3, column: 1 },
    },
  },
  code: {
    functionName: "makeCoffee",
    location: {
      filePath: "/steps/coffee.ts",
      start: { line: 10, column: 5 },
    },
  },
};

const extendedContext: GherkinErrorContext = {
  gherkin: {
    location: {
      filePath: "/features/coffee.feature",
      start: { line: 3, column: 1 },
      end: { line: 4, column: 10 },
    },
  },
  code: {
    location: {
      filePath: "/steps/coffee.ts",
      start: { line: 10, column: 5 },
      end: { line: 11, column: 3 },
    },
  },
  path: [
    {
      role: "scenario",
      keyword: "Scenario",
      name: "Make a coffee",
      text: "Coffee is ready",
      index: 1,
      location: {
        filePath: "/features/coffee.feature",
        start: { line: 1, column: 1 },
        end: { line: 1, column: 20 },
      },
    },
  ],
  steps: [
    {
      keyword: "Given",
      text: "a brewed beverage",
      status: "failed",
      location: {
        filePath: "/features/coffee.feature",
        start: { line: 3, column: 1 },
        end: { line: 3, column: 15 },
      },
    },
  ],
};

describe("GherkinStepError", () => {
  it("exposes the provided context", () => {
    const error = new GherkinStepError("boom", { context: baseContext });

    expect(error.context).toEqual(baseContext);
  });

  it("freezes nested context structures", () => {
    const error = new GherkinStepError("boom", { context: extendedContext });

    expect(Object.isFrozen(error.context)).toBe(true);
    expect(Object.isFrozen(error.context.path)).toBe(true);
    expect(Object.isFrozen(error.context.steps)).toBe(true);
    expect(Object.isFrozen(error.context.path?.[0]?.location ?? {})).toBe(true);
    expect(Object.isFrozen(error.context.steps?.[0]?.location ?? {})).toBe(true);

    expect(() => {
      (error.context.path as unknown as unknown[])[0] = { other: true } as never;
    }).toThrow(TypeError);

    expect(() => {
      (error.context.steps as unknown as unknown[])[0] = { other: true } as never;
    }).toThrow(TypeError);

    expect(error.context.path?.[0]?.index).toBe(1);
    expect(error.context.steps?.[0]?.location?.end).toEqual({ line: 3, column: 15 });
  });

  it("omits optional fields when not provided", () => {
    const minimalContext: GherkinErrorContext = {
      gherkin: {
        location: {
          filePath: "/features/minimal.feature",
          start: { line: 1, column: 1 },
        },
      },
      code: {
        location: {
          filePath: "/steps/minimal.ts",
          start: { line: 5, column: 1 },
        },
      },
    };

    const error = new GherkinStepError("boom", { context: minimalContext });

    expect("featureName" in (error.context.gherkin ?? {})).toBe(false);
    expect(error.context.code?.functionName).toBeUndefined();
    expect(error.context.path).toBeUndefined();
    expect(error.context.steps).toBeUndefined();
  });

  it("supports bare path and step summaries", () => {
    const pathOnlyContext: GherkinErrorContext = {
      path: [
        {
          role: "step",
          location: {
            filePath: "/features/simple.feature",
            start: { line: 2, column: 1 },
          },
        },
      ],
      steps: [
        {
          status: "skipped",
        },
      ],
    };

    const error = new GherkinStepError("boom", { context: pathOnlyContext });

    expect(error.context.gherkin).toBeUndefined();
    expect(error.context.code).toBeUndefined();
    expect(error.context.path?.[0]).toEqual({
      role: "step",
      location: {
        filePath: "/features/simple.feature",
        start: { line: 2, column: 1 },
      },
    });
    expect("location" in (error.context.steps?.[0] ?? {})).toBe(false);
    expect("keyword" in (error.context.steps?.[0] ?? {})).toBe(false);
    expect("text" in (error.context.steps?.[0] ?? {})).toBe(false);
  });

  it("provides context via helper", () => {
    const error = new GherkinStepError("boom", { context: baseContext });

    expect(getGherkinErrorContext(error)).toEqual(baseContext);
  });

  it("identifies gherkin step errors", () => {
    const error = new GherkinStepError("boom", { context: baseContext });

    expect(isGherkinStepError(error)).toBe(true);
    expect(isGherkinStepError(new Error("nope"))).toBe(false);
  });

  it("walks the error cause chain", () => {
    const inner = new GherkinStepError("inner", { context: baseContext });
    const outer = attachCause(new Error("wrapper"), inner);

    expect(getGherkinErrorContext(outer)).toEqual(baseContext);
  });

  it("stops when cause is not an error", () => {
    const inner = new GherkinStepError("inner", { context: baseContext });
    const outer = attachCause(new Error("wrapper"), { cause: inner });

    expect(getGherkinErrorContext(outer)).toBeUndefined();
  });

  it("handles missing causes and cycles safely", () => {
    const plainError = new Error("plain");
    expect(getGherkinErrorContext(plainError)).toBeUndefined();

    expect(getGherkinErrorContext("not an error")).toBeUndefined();

    const first = new Error("first");
    const second = new Error("second");
    attachCause(first, second);
    attachCause(second, first);

    expect(getGherkinErrorContext(first)).toBeUndefined();
  });

  it("throws when context symbol is missing", () => {
    const orphan = Object.create(GherkinStepError.prototype) as GherkinStepError;
    expect(() => orphan.context).toThrow("Missing Gherkin context for error instance");
  });
});

function attachCause<T extends Error>(error: T, cause: unknown): T {
  Object.defineProperty(error, "cause", {
    configurable: true,
    enumerable: false,
    writable: false,
    value: cause,
  });
  return error;
}
