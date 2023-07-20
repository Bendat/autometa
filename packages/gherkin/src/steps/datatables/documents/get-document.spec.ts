import { describe, expect, it } from "vitest";
import { DataTableDocument, DocumentTable, HTable, getDocumentTable } from "../..";

@DocumentTable(HTable)
class MyDoc extends DataTableDocument<HTable> {}
describe("get document table", () => {
  it("should get the table from a document prototype", () => {
    const tableType = getDocumentTable(MyDoc);
    expect(tableType).toBe(HTable);
  });
});
