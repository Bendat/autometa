import { beforeEach, describe, expect, it } from "vitest";
import {
  configureStepTables,
  consumeDocstring,
  consumeTable,
  createStepRuntime,
  getDocstring,
  getRawTable,
  getTable,
  resetStepTableConfig,
  setStepDocstring,
  setStepTable,
} from "../step-data";

interface WorldState {
  note?: string;
}

describe("step-data", () => {
  let world: WorldState;

  beforeEach(() => {
    world = {};
    resetStepTableConfig();
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

  it("defaults horizontal tables to primitive coercion", () => {
    setStepTable(world, [
      ["header", "value"],
      ["count", "1"],
    ]);
    const table = getTable(world, "horizontal");
    expect(table?.getRow(0)).toEqual({ header: "count", value: 1 });
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
    setStepDocstring(world, "example docstring");

    const runtime = createStepRuntime(world);

    expect(runtime.hasTable).toBe(true);
    expect(runtime.hasDocstring).toBe(true);

    const table = runtime.getTable("horizontal");
    expect(table?.getRow(0)).toEqual({ id: 1, flag: true });
    expect(runtime.getDocstring()).toBe("example docstring");

    runtime.consumeTable("horizontal");
    expect(runtime.hasTable).toBe(false);

    runtime.consumeDocstring();
    expect(runtime.hasDocstring).toBe(false);
  });
});
