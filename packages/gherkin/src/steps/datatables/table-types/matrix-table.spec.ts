import { expect, describe, it } from "vitest";
import { MTable } from "./matrix-table";
import { CompiledDataTable } from "../compiled-data-table";

describe("MTable", () => {
  it("should get a value from a mtable", () => {
    const compiled = new CompiledDataTable(
      [
        ["", "dry", "wet"],
        ["soft", "pillow", "water"],
        ["hard", "stone", "ice"]
      ],
      [
        ["", "dry", "wet"],
        ["soft", "pillow", "water"],
        ["hard", "stone", "ice"]
      ]
    );
    const mtable = new MTable(compiled);

    expect(mtable.get("hard", "dry")).toEqual("stone");
    expect(mtable.get("soft", "dry")).toEqual("pillow");
    expect(mtable.get("hard", "wet")).toEqual("ice");
    expect(mtable.get("soft", "wet")).toEqual("water");
  });
  it("should get a row and column", () => {
    const compiled = new CompiledDataTable(
      [
        ["", "dry", "wet"],
        ["soft", "pillow", "water"],
        ["hard", "stone", "ice"]
      ],
      [
        ["", "dry", "wet"],
        ["soft", "pillow", "water"],
        ["hard", "stone", "ice"]
      ]
    );
    const mtable = new MTable(compiled);

    expect(mtable.getRow("hard")).toEqual(["stone", "ice"]);
    expect(mtable.getCol("wet")).toEqual(["water", "ice"]);
  });
});
