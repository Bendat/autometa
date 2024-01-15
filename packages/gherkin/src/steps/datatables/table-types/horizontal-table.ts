import { TableValue } from "../table-value";
import { CompiledDataTable } from "../compiled-data-table";
import { overloads, def, string, number, boolean } from "@autometa/overloaded";
import { AutomationError } from "@autometa/errors";
import { Bind } from "@autometa/bind-decorator";
import { DataTable, mapHeaders } from "./data-table";
import { TableDocument } from "../table-documents";
/**
 * A horizontal table is a table where the first row is the header row,
 * and each subsequent row is a row of values.
 *
 * For example:
 *
 * ```gherkin
 * Given I have a Table
 *  | Header 1 | Header 2 | Header 3 |
 *  | Value 1  | Value 2  | Value 3  |
 * ```
 */
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

  get count(): number {
    return this.rows.length;
  }
  /**
   * Retrieves a column from the table by it's header.
   * By default the values will be coerced to their typescript types,
   * i.e a value '1' in a table cell will be coerced into a number,
   * 'true' to a boolean, etc.
   *
   * Specifying the raw flag will return the column with it's original string
   * value.
   * @param header The header string of the column to retrieve
   * @param raw Whether to return the column with it's original string values
   */
  get<T extends [...TableValue[]] = [...TableValue[]]>(
    header: string,
    raw?: boolean
  ): T;
  /**
   * Retrieves a value from a specific table cell using
   * the header and row index.
   *
   * By default the value will be coerced to it's typescript type,
   * i.e a value '1' in a table cell will be coerced into a number,
   * 'true' to a boolean, etc.
   *
   * Specifying the raw flag will return the value with it's original string
   * value.
   *
   * @param header
   * @param row
   * @param raw
   */
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
      })
    ).use(args);
  }

  static cell(title: string, raw?: boolean) {
    return function (target: object, propertyKey: string) {
      Object.defineProperty(target, propertyKey, {
        get: function () {
          if (!(this.$_table instanceof HTable)) {
            const msg = `Decorating a table document using HTable, however the defined table type for this object is ${this?._table?.constructor?.name}.`;
            throw new AutomationError(msg);
          }
          const table = this.$_table as HTable;
          return table.get(title, this.$_index, raw);
        }
      });
    };
  }

  private handleError(
    colIdx: number,
    source: readonly TableValue[][],
    header: string,
    row: number
  ) {
    if (colIdx > source.length) {
      const maxLength = source.length - 1;
      const msg = `Could not find column ${header} row ${row}. Max length for row is ${maxLength} on ${source}.`;
      throw new AutomationError(msg);
    }
  }

  getOrThrow<T extends TableValue = TableValue>(header: TableValue): T[];
  getOrThrow<T extends TableValue = TableValue>(header: string, row: number): T;
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

  static Document(){
    return super.CreateDocument(HTable, HTableDocument);
  }
  asJson(): Record<string, TableValue[]> {
    const json: Record<string, TableValue[]> = {};
    for (const header in this.headers) {
      json[header] = this.get(header);
    }
    return json;
  }
}

class HTableDocument extends TableDocument<HTable> {
  static readonly TableType = HTable;

  constructor(table: HTable, index: number) {
    super(table, index);
  }
}
