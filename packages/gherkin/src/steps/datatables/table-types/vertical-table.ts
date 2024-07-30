import { TableValue } from "../table-value";
import { CompiledDataTable } from "../compiled-data-table";
import { Bind } from "@autometa/bind-decorator";
import { DataTable } from "./data-table";
import { overloads, def, string, number, boolean } from "@autometa/overloaded";
import { AutomationError } from "@autometa/errors";
import { TableDocument } from "../table-documents";

/**
 * A vertical table is a table where the first cell of each row is the header,
 * and each subsequent cell is a value.
 *
 * For example:
 *
 * ```gherkin
 * Given I have a Table
 * | Header 1 | value 1 |
 * | Header 2 | value 2 |
 * | Header 3 | value 3 |
 * ```
 */
export class VTable extends DataTable {
  private headers: string[];
  private columns: readonly TableValue[][];
  private rawColumns: readonly string[][];
  private headerMapping: { [key: string]: number };
  get count(): number {
    return this.columns.length;
  }

  protected construct({ table, raw }: CompiledDataTable): void {
    this.headerMapping = {};
    this.headers = raw.map(([title]) => String(title));
    this.columns = table.map(([_, ...rows]) => rows);
    this.rawColumns = raw.map(([_, ...rows]) => rows);
    const mapHeaders = (header: string, idx: number) => {
      const mapping = this.headerMapping;
      mapping[header] = idx;
    };
    this.headers.forEach(mapHeaders);
  }

  /**
   * Retrieves a row from the table by it's header.
   * By default the values will be coerced to their typescript types,
   * i.e a value '1' in a table cell will be coerced into a number,
   * 'true' to a boolean, etc.
   *
   * Specifying the raw flag will return the row with it's original string
   * value.
   * @param header The header string of the row to retrieve
   * @param raw Whether to return the row with it's original string values
   * @returns The row as an array of values
   */
  get<T extends [...TableValue[]] = [...TableValue[]]>(
    header: string,
    raw?: boolean
  ): T;
  /**
   * Retrieves a value from a specific table cell using
   * the header and column index.
   *
   * By default the value will be coerced to it's typescript type,
   * i.e a value '1' in a table cell will be coerced into a number,
   * 'true' to a boolean, etc.
   *
   * Specifying the raw flag will return the value with it's original string
   * value.
   *
   * @param header
   * @param column
   * @param raw
   * @returns The value at the specified cell
   */
  get<T extends TableValue = TableValue>(
    header: string,
    col: number,
    raw?: boolean
  ): T;
  @Bind
  get<T extends TableValue = TableValue>(
    ...args: (string | number | boolean | undefined)[]
  ) {
    return overloads(
      def(string(), number(), boolean()).matches((header, col, raw) => {
        const rowIdx = this.headerMapping[header];
        const source = raw === true ? this.rawColumns : this.columns;
        const column = source[rowIdx];
        return column[col] as T;
      }),
      def(string(), number()).matches((header, col) => {
        const rowIdx = this.headerMapping[header];
        const source = this.columns;
        const column = source[rowIdx];
        return column[col] as T;
      }),
      def(string(), boolean()).matches((header, raw) => {
        const colIdx = this.headerMapping[header];
        const source = raw === true ? this.rawColumns : this.columns;
        return source[colIdx] as T[];
      }),
      def(string()).matches((header) => {
        const colIdx = this.headerMapping[header];
        const source = this.columns;
        return source[colIdx] as T[];
      })
    ).use(args);
  }

  getOrThrow<TReturn extends TableValue[] = TableValue[]>(
    header: TableValue
  ): TReturn;
  getOrThrow<TReturn extends TableValue = TableValue>(
    header: TableValue,
    column: number
  ): TReturn;

  @Bind
  getOrThrow(header: string, column?: number): TableValue | TableValue[] {
    const result = this.get(header, column as number);
    if (result === undefined) {
      const colSug = column !== undefined ? ` at column ${column}` : "";
      const maxSize = Math.max(...this.columns.map((col) => col.length));
      const maxSizeSlug = ` (max size ${maxSize})`;
      throw new AutomationError(
        `Could not find row ${header}${colSug}${maxSizeSlug}}`
      );
    }
    return result;
  }

  static cell(
    title: string,
    transformer?: (value: string) => unknown
  ): PropertyDecorator;
  static cell(title: string, raw?: boolean): PropertyDecorator;
  static cell(title: string, raw?: boolean | ((value: string) => unknown)) {
    return function (target: object, propertyKey: string) {
      Object.defineProperty(target, propertyKey, {
        get: function () {
          if (!(this.$_table instanceof VTable)) {
            const msg = `Decorating a table document using VTable, however the defined table type for this object is ${this?._table?.constructor?.name}.`;
            throw new AutomationError(msg);
          }
          const table = this.$_table as VTable;
          if(typeof raw === 'function') {
            return raw(table.get(title,this.$_index, true) as string);
          }
          return table.get(title, this.$_index, raw);
        },
      });
    };
  }

  static Document() {
    return super.CreateDocument(VTable, VTableDocument);
  }

  asJson(): Record<string, TableValue[]> {
    const json: Record<string, TableValue[]> = {};
    this.headers.forEach((header) => {
      json[header] = this.get(header);
    });
    return json;
  }
}

class VTableDocument extends TableDocument<VTable> {
  static readonly TableType = VTable;
}
