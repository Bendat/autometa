import { describe, expect, it } from "vitest";
import {
  HeaderlessTable,
  HorizontalTable,
  MatrixTable,
  VerticalTable,
  createTable,
} from "./index";

describe("HeaderlessTable", () => {
  const raw = [
    ["1", "true"],
    ["2", "false"],
  ];

  it("returns raw rows by default", () => {
    const table = new HeaderlessTable(raw);
    expect(table.rows()).toEqual([
      ["1", "true"],
      ["2", "false"],
    ]);
  });

  it("coerces when requested", () => {
    const table = new HeaderlessTable(raw, { coerce: true });
    expect(table.rows()).toEqual([
      [1, true],
      [2, false],
    ]);
  });
});

describe("HorizontalTable", () => {
  const raw = [
    ["first", "second"],
    ["1", "true"],
    ["2", "false"],
  ];

  it("coerces by default", () => {
    const table = new HorizontalTable(raw);
    expect(table.getRow(0)).toEqual({ first: 1, second: true });
  });

  it("allows raw access", () => {
    const table = new HorizontalTable(raw);
    expect(table.getRow(1, { raw: true })).toEqual({ first: "2", second: "false" });
  });

  it("supports createTable factory", () => {
    const table = createTable(raw, "horizontal");
    expect(table).toBeInstanceOf(HorizontalTable);
  });

  it("provides trimmed records", () => {
    const table = new HorizontalTable([
      ["Product Name", "Cost"],
      ["  Fancy Burger  ", " 9.50 "],
    ]);
    expect(table.records()).toEqual([
      { "Product Name": "Fancy Burger", Cost: 9.5 },
    ]);
  });

  it("maps rows to instances with header aliases", () => {
    class MenuItem {
      name = "";
      price = 0;
    }

    const table = new HorizontalTable([
      ["Item", "Price"],
      ["Burger", "12"],
      ["Shake", "4.5"],
    ]);

    const items = table.asInstances(MenuItem, {
      headerMap: { Item: "name", Price: "price" },
    });

    expect(items).toEqual([
      { name: "Burger", price: 12 },
      { name: "Shake", price: 4.5 },
    ]);
  });

  it("maps records with a custom mapper", () => {
    const table = new HorizontalTable([
      ["name", "price"],
      ["Tea", "3"],
      ["Coffee", "4"],
    ]);

    const tuples = table.mapRecords((record, context) => ({
      index: context.rowIndex,
      name: record.name,
      price: record.price,
    }));

    expect(tuples).toEqual([
      { index: 0, name: "Tea", price: 3 },
      { index: 1, name: "Coffee", price: 4 },
    ]);
  });
});

describe("VerticalTable", () => {
  const raw = [
    ["first", "1", "2"],
    ["second", "true", "false"],
  ];

  it("creates series per header", () => {
    const table = new VerticalTable(raw);
    expect(table.getSeries("first")).toEqual([1, 2]);
    expect(table.getRecord(1)).toEqual({ first: 2, second: false });
  });

  it("maps records to instances", () => {
    class Measurement {
      label = "";
      distance = 0;
      active = false;
    }

    const table = new VerticalTable([
      ["Label", "Run", "Walk"],
      ["Distance", "10", "2.5"],
      ["Active", "true", "false"],
    ]);

    const records = table.mapRecords((record) => ({
      label: record.Label,
      distance: record.Distance,
      active: record.Active,
    }));

    expect(records).toEqual([
      { label: "Run", distance: 10, active: true },
      { label: "Walk", distance: 2.5, active: false },
    ]);

    const instances = table.asInstances(Measurement, {
      headerMap: { Label: "label", Distance: "distance", Active: "active" },
    });

    expect(instances).toEqual([
      { label: "Run", distance: 10, active: true },
      { label: "Walk", distance: 2.5, active: false },
    ]);
  });

  it("iterates over records", () => {
    const table = new HorizontalTable([
      ["flavour", "seasonal"],
      ["Cinnamon", "true"],
      ["Mocha", "false"],
    ]);

    const flavours: string[] = [];
    for (const record of table) {
      flavours.push(String(record.flavour));
    }

    expect(flavours).toEqual(["Cinnamon", "Mocha"]);
  });
});

describe("MatrixTable", () => {
  const raw = [
    ["", "colA", "colB"],
    ["row1", "1", "true"],
    ["row2", "2", "false"],
  ];

  it("resolves rows and columns", () => {
    const table = new MatrixTable(raw);
    expect(table.getRow("row1")).toEqual({ colA: 1, colB: true });
    expect(table.getColumn("colB")).toEqual({ row1: true, row2: false });
  });
});
