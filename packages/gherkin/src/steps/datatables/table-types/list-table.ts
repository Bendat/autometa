import { overloads, def, number, boolean } from "@autometa/overloaded";
import { CompiledDataTable } from "../compiled-data-table";
import { TableValue } from "../table-value";
import { DataTable } from "./data-table";

/**
 * A list table is a table where each row is a list of values,
 * and which has no defined headers.
 *
 * For example:
 *
 * ```gherkin
 * Given I have a Table
 * | value 1 | value 2 | value 3 |
 * | value 4 | value 5 | value 6 |
 */
export class ListTable extends DataTable {
  protected table: TableValue[][];
  protected raw: string[][];
  get original() {
    return this.raw;
  }
  get coerced() {
    return this.table;
  }

  get count(): number {
    throw new Error(
      "List Table is not countable  cannot be used with documents"
    );
  }

  /**
   * Retrieves a row from the table by it's index.
   * By default the values will be coerced to their typescript types,
   * i.e a value '1' in a table cell will be coerced into a number,
   * 'true' to a boolean, etc.
   *
   * Specifying the raw flag will return the row with it's original string
   * value.
   * @param row The index of the row to retrieve
   * @param raw Whether to return the row with it's original string values
   * @returns The row as an array of values
   */
  get<T extends [...TableValue[]] = [...TableValue[]]>(
    row: number,
    raw?: boolean
  ): T;

  get<T extends TableValue = TableValue>(
    row: number,
    col: number,
    raw?: boolean
  ): T;
  get<T extends TableValue = TableValue>(
    ...args: (number | boolean | undefined)[]
  ) {
    return overloads(
      def(number(), boolean()).matches((row, raw) => {
        const source = raw === true ? this.raw : this.table;
        this.handleError(row, source);
        return source[row] as T[];
      }),
      def(number(), number(), boolean()).matches((row, col, raw) => {
        const source = raw === true ? this.raw : this.table;
        this.handleError(row, source);
        return source[row][col] as T;
      })
    ).use(args);
  }

  private handleError(rowIdx: number, source: readonly TableValue[][]) {
    if (rowIdx > source.length) {
      const maxLength = source.length - 1;
      const msg = `Could not find row ${rowIdx}. Max length for row is ${maxLength} on ${source}.`;
      throw new Error(msg);
    }
  }

  protected construct({ table, raw }: CompiledDataTable) {
    this.table = table;
    this.raw = raw;
  }

  asJson(): Record<string, TableValue[]> {
    const json: Record<number, TableValue[]> = {};
    const length = this.raw.length;
    for (let i = 0; i < length; i++) {
      json[i] = this.raw[i];
    }
    return json;
  }
}
