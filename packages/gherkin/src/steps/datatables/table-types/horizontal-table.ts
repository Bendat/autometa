import { TableValue } from "../table-value";
import { CompiledDataTable } from "../compiled-data-table";
import { overloads, def, string, number, boolean } from "@autometa/overloaded";
import { AutomationError } from "@autometa/errors";
import { Bind } from "@autometa/bind-decorator";
import { DataTable, mapHeaders } from "./data-table";
export class HTable extends DataTable {
  private headers: { [header: string]: number };
  private rows: readonly TableValue[][];
  private raw: readonly string[][];
  @Bind
  protected construct(table: CompiledDataTable): void {
    const [_headers, ...rows] = table.table as [string[], TableValue[]];
    const [headers, ...rawRows] = table.raw as [string[], string[]];
    this.rows = rows;
    this.raw = rawRows;
    this.headers = mapHeaders(headers);
  }

  get<T extends [...TableValue[]] = [...TableValue[]]>(header: string, raw?: boolean): T;
  get<T extends TableValue = TableValue>(
    header: string,
    row: number,
    raw?: boolean
  ): T;
  @Bind
  get<T extends TableValue = TableValue>(
    ...args: (string | number | boolean | undefined)[]
  ) {
    return overloads(
      def(string(), number(), boolean()).matches((header, row, raw) => {
        const colIdx = this.headers[header];
        const source = raw === true ? this.raw : this.rows;
        this.handleError(colIdx, source, header, row);
        return source[colIdx][row] as T;
      }),
      def(string(), number()).matches((header, row) => {
        const colIdx = this.headers[header];
        const source = this.rows;
        const col = this.rows.map((row) => row[colIdx]);
        this.handleError(colIdx, source, header, row);
        return col.at(row);
      }),
      def(string(), boolean()).matches((header, raw) => {
        const colIdx = this.headers[header];
        const source = raw === true ? this.raw : this.rows;
        return source[colIdx] as T[];
      }),
      def(string()).matches((header) => {
        const colIdx = this.headers[header];
        return this.rows.map((row) => row[colIdx]);
      }),
    ).use(args);
  }

  private handleError(colIdx: number, source: readonly TableValue[][], header: string, row: number) {
    if (colIdx > source.length) {
      const maxLength = source.length - 1;
      const msg = `Could not find column ${header} row ${row}. Max length for row is ${maxLength} on ${source}.`;
      throw new AutomationError(msg);
    }
  }

  getOrThrow<T extends TableValue = TableValue>(header: TableValue): T[];
  getOrThrow<T extends TableValue = TableValue>(
    header: string,
    row: number
  ): T;
  @Bind
  getOrThrow(
    header: string,
    row?: number,
    raw?: boolean
  ): TableValue | TableValue[] {
    const result = this.get(header, row as number, raw);
    if (result === undefined) {
      const rowSug = row !== undefined ? ` at row ${row}` : "";
      const maxSize = Math.max(...this.rows.map((row) => row.length));
      const maxSizeSlug = ` (max size ${maxSize})`;
      const message = `Could not find column ${header}${rowSug}${maxSizeSlug}}`;
      throw new AutomationError(message);
    }
    return result;
  }
}