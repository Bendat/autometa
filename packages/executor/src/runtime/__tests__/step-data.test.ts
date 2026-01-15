import { beforeEach, describe, expect, it } from "vitest";
import {
  configureStepDocstrings,
  configureStepTables,
  consumeDocstring,
  consumeTable,
  createStepRuntime,
  getDocstringInfo,
  getDocstringMediaType,
  type StepRuntimeHelpers,
  getDocstring,
  getRawTable,
  getTable,
  resetStepDocstringConfig,
  resetStepTableConfig,
  setStepDocstring,
  setStepDocstringInfo,
  setStepTable,
} from "../step-data";

interface WorldState {
  note?: string;
  runtime?: StepRuntimeHelpers;
}

describe("step-data", () => {
  let world: WorldState;

  beforeEach(() => {
    world = {};
    resetStepTableConfig();
    resetStepDocstringConfig();
    setStepTable(world, undefined);
    setStepDocstring(world, undefined);
  });

  it("returns undefined when no data table is present", () => {
    expect(getTable(world, "horizontal")).toBeUndefined();
  });

  it("stores and retrieves docstrings independently of tables", () => {
    setStepDocstring(world, "example docstring");
    expect(getDocstring(world)).toBe("example docstring");
    expect(consumeDocstring(world)).toBe("example docstring");
    expect(getDocstring(world)).toBeUndefined();
  });

  it("stores and retrieves docstring media types", () => {
    setStepDocstringInfo(world, { content: "{\"ok\":true}", mediaType: "application/json" });

    expect(getDocstring(world)).toBe("{\"ok\":true}");
    expect(getDocstringMediaType(world)).toBe("application/json");
    expect(getDocstringInfo(world)).toEqual({
      content: "{\"ok\":true}",
      mediaType: "application/json",
    });

    expect(consumeDocstring(world)).toBe("{\"ok\":true}");
    expect(getDocstring(world)).toBeUndefined();
    expect(getDocstringMediaType(world)).toBeUndefined();
  });

  it("transforms docstrings based on media type", () => {
    configureStepDocstrings({
      transformers: {
        json: (raw) => JSON.parse(raw),
      },
    });

    setStepDocstringInfo(world, { content: "{\"count\":2}", mediaType: "application/json" });
    const runtime = createStepRuntime(world);

    expect(runtime.getDocstringTransformed()).toEqual({ count: 2 });
    expect(runtime.getDocstring()).toBe("{\"count\":2}");

    expect(runtime.consumeDocstringTransformed()).toEqual({ count: 2 });
    expect(runtime.hasDocstring).toBe(false);
  });

  it("falls back to raw content when no docstring transformer matches", () => {
    setStepDocstringInfo(world, { content: "plain text", mediaType: "text/plain" });
    const runtime = createStepRuntime(world);
    expect(runtime.getDocstringTransformed()).toBe("plain text");
  });

  it("can throw when a transformer is required but missing", () => {
    setStepDocstringInfo(world, { content: "{}", mediaType: "application/json" });
    const runtime = createStepRuntime(world);
    expect(() => runtime.getDocstringTransformed({ fallback: "throw" })).toThrow(
      "No docstring transformer is configured for media type"
    );
  });

  it("defaults horizontal tables to primitive coercion", () => {
    setStepTable(world, [
      ["header", "value"],
      ["count", "1"],
    ]);
    const table = getTable(world, "horizontal");
    expect(table?.getRow(0)).toEqual({ header: "count", value: 1 });
  });

  it("accepts class and instance table option providers", () => {
    class HorizontalTransform {
      readonly coerce = false;
      readonly keys = {
        "Reports To": "reportsTo",
        "Start Date": "startDate",
      } as const;
      readonly transformers = {
        reportsTo: (value: string) => value.toUpperCase(),
      };
    }

    setStepTable(world, [
      ["Reports To", "Start Date"],
      ["Ada", "2020-01-15"],
    ]);

    const tableFromClass = getTable(world, "horizontal", HorizontalTransform);
    expect(tableFromClass?.getRow(0)).toEqual({
      reportsTo: "ADA",
      startDate: "2020-01-15",
    });

    setStepTable(world, [
      ["Reports To", "Start Date"],
      ["Bob", "2021-06-01"],
    ]);

    const tableFromInstance = getTable(
      world,
      "horizontal",
      new HorizontalTransform()
    );
    expect(tableFromInstance?.getCell("reportsTo", 0)).toBe("BOB");
  });

  it("allows coercion defaults to be overridden per shape", () => {
    setStepTable(world, [
      ["header", "value"],
      ["count", "1"],
    ]);
    configureStepTables({
      coercePrimitives: { horizontal: false },
    });
    const table = getTable(world, "horizontal");
    expect(table?.getRow(0)).toEqual({ header: "count", value: "1" });
  });

  it("defaults headerless tables to raw strings", () => {
    setStepTable(world, [
      ["1", "true"],
      ["2", "false"],
    ]);
    const table = getTable(world, "headerless");
    expect(table?.rows()).toEqual([
      ["1", "true"],
      ["2", "false"],
    ]);
  });

  it("consumes tables when requested", () => {
    setStepTable(world, [
      ["header", "value"],
      ["count", "1"],
    ]);
    const table = consumeTable(world, "horizontal");
    expect(table).toBeDefined();
    expect(getRawTable(world)).toBeUndefined();
  });

  it("binds runtime helpers to the active world", () => {
    setStepTable(world, [
      ["id", "flag"],
      ["1", "true"],
    ]);
    setStepDocstringInfo(world, { content: "example docstring", mediaType: "text/plain" });

    const runtime = createStepRuntime(world);

    expect(world.runtime).toBe(runtime);
    expect(runtime.hasTable).toBe(true);
    expect(runtime.hasDocstring).toBe(true);

    const table = runtime.getTable("horizontal");
    expect(table?.getRow(0)).toEqual({ id: 1, flag: true });
    const consumed = runtime.requireTable("horizontal");
    expect(consumed.getRow(0)).toEqual({ id: 1, flag: true });
    expect(runtime.getDocstring()).toBe("example docstring");
    expect(runtime.getDocstringMediaType()).toBe("text/plain");

    expect(runtime.hasTable).toBe(false);

    runtime.consumeDocstring();
    expect(runtime.hasDocstring).toBe(false);
  });
});
