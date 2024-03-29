import { ParsedDataTable } from "./datatable";
import { CompiledDataTable } from "./table-type";
import { TableValue } from "./table-value";
interface IListTable {
  /**
   * Get an array of table values corresponding
   * to an entire row of the Datatable
   * @param rowIndex The index of the row to retrieve
   */
  get(rowIndex: number): string[];
  /**
   * Get a value corresponding to an entry of
   * a row.
   * @param rowIndex The index of the row to retrieve
   * @param columnIndex The column in the selected row to retrieve a cell from
   */
  get(rowIndex: number, columnIndex: number): string;
  get(rowIndex: number, columnIndex?: number): string[] | string;
}
/**
 * Datatable transformer that converts
 * a Datatable to a simple list of tuples type
 * that do not have titles or headers.
 *
 * ```gherkin
 * Given a group of men
 *  | John | 46  | farmer |
 *  | Burt | 24  | doctor |
 * ```
 *
 */
export class ListTable extends ParsedDataTable implements IListTable {
  asJson(): Record<string, TableValue[]> {
    const json: Record<number, TableValue[]> = {};
    const length = this.rows.length;
    for (let i = 0; i < length; i++) {
      json[i] = this.rows[i];
    }
    return json;
  }

  readonly rows: readonly string[][];
  constructor(protected raw: CompiledDataTable) {
    super();
    this.rows = raw;
  }

  get = (rowIndex: number, columnIndexOrRaw?: number | boolean, raw?: boolean) => {
    let index: number | null | undefined;
    let getRaw = raw;
    if (typeof columnIndexOrRaw === "boolean") {
      getRaw = columnIndexOrRaw;
    } else {
      index = columnIndexOrRaw;
    }
    const row = getRaw ? this.raw : this.rows.at(rowIndex);

    if (!row) {
      throw new Error(`No table row found at index ${rowIndex}`);
    }

    if (typeof index === "number") {
      const cell = row.at(index);
      if (!cell) {
        throw new Error(`No table cell found at index ${rowIndex}, ${columnIndexOrRaw}`);
      }
      return cell;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return row as any;
  };
}
