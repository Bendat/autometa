import { Class } from "@autometa/types";
import { DataTable } from "../";
import { TableTypeSymbol } from "../..";
import { AutomationError } from "@autometa/errors";

export function getDocumentTable(table: unknown): Class<DataTable> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asAny = table as { name: string };
  if (TableTypeSymbol in asAny) {
    return asAny[TableTypeSymbol] as Class<DataTable>;
  }
  throw new AutomationError(
    `Table ${asAny?.name} does not contain a table type. Did you forget to decorate the table with @DocumentTable?`
  );
}
