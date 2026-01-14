import { describe, expect, it, vi } from "vitest";

import { resolveModeFromTags, selectSuiteByMode, selectTestByMode } from "../modes";
import type { SuiteFn, TestFn } from "../types";

describe("resolveModeFromTags", () => {
  it("keeps explicit mode overrides", () => {
    const mode = resolveModeFromTags("only", ["@concurrent"]);
    expect(mode).toBe("only");
  });

  it("derives concurrent mode from tags", () => {
    const mode = resolveModeFromTags("default", ["@Concurrent"]);
    expect(mode).toBe("concurrent");
  });

  it("derives failing mode from aliases", () => {
    const mode = resolveModeFromTags("default", ["fails"]);
    expect(mode).toBe("failing");
  });

  it("falls back to default when no known tags are present", () => {
    const mode = resolveModeFromTags("default", ["@fast"]);
    expect(mode).toBe("default");
  });
});

describe("selectSuiteByMode", () => {
  it("prefers concurrent suite implementation when available", () => {
    const base = vi.fn();
    const concurrent = vi.fn();
    const suite = base as unknown as SuiteFn;
    suite.skip = base as unknown as SuiteFn;
    suite.only = base as unknown as SuiteFn;
    suite.concurrent = concurrent as unknown as SuiteFn;

    const selected = selectSuiteByMode(suite, "concurrent");
    expect(selected).toBe(suite.concurrent);
  });
});

describe("selectTestByMode", () => {
  function createTestStub(): { test: TestFn; handlers: Array<() => void | Promise<void>> } {
    const handlers: Array<() => void | Promise<void>> = [];
    const impl = vi.fn((_: string, handler: () => void | Promise<void>) => {
      handlers.push(handler);
    });

    const test = impl as unknown as TestFn;
    test.skip = impl as unknown as TestFn;
    test.only = impl as unknown as TestFn;

    return { test, handlers };
  }

  it("prefers concurrent variant when available", () => {
    const { test } = createTestStub();
    const concurrent = vi.fn();
    test.concurrent = concurrent as unknown as TestFn;

    const selected = selectTestByMode(test, "concurrent");
    expect(selected).toBe(concurrent);
  });

  it("wraps failing behaviour when the runtime lacks native support", async () => {
    const { test, handlers } = createTestStub();

    const failing = selectTestByMode(test, "failing");
    failing("failing scenario", async () => undefined);

    expect(handlers).toHaveLength(1);
    await expect(handlers[0]()).rejects.toThrow(/expected scenario to fail/i);

    failing("expected failure", async () => {
      throw new Error("boom");
    });

    expect(handlers).toHaveLength(2);
    await expect(handlers[1]()).resolves.toBeUndefined();
  });

  it("delegates to native failing helpers when present", () => {
    const { test } = createTestStub();
    const nativeFailing = vi.fn();
    test.failing = nativeFailing as unknown as TestFn;

    const selected = selectTestByMode(test, "failing");
    expect(selected).toBe(nativeFailing);
  });
});
