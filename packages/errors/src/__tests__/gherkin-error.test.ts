import { describe, expect, it } from "vitest";
import {
  GherkinStepError,
  getGherkinErrorContext,
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

describe("GherkinStepError", () => {
  it("exposes the provided context", () => {
    const error = new GherkinStepError("boom", { context: baseContext });

    expect(error.context).toEqual(baseContext);
  });

  it("provides context via helper", () => {
    const error = new GherkinStepError("boom", { context: baseContext });

    expect(getGherkinErrorContext(error)).toEqual(baseContext);
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
