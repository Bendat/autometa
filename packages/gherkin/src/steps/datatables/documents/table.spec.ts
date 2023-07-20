import { describe, it, expect } from "vitest";
import { DocumentTable } from "./table";
import { HTable } from "../table-types/horizontal-table";
import { TableTypeSymbol } from "../..";
@DocumentTable(HTable)
class TestDocument {}
describe("table", () => {
  it("should set the table type", () => {
    const doc = TestDocument as unknown as TestDocument & { TableTypeSymbol: HTable };
    if((!(TableTypeSymbol in doc))){
        expect.fail('TableTypeSymbol not defined in TestDocument')
    }
    expect(doc[TableTypeSymbol]).toEqual(HTable);
  });
});
