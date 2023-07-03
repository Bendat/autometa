import { ParsedDataTable } from "./datatable";
import { CompiledDataTable } from "./table-type";
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
  readonly rows: readonly string[][];
  constructor(protected raw: CompiledDataTable) {
    super();
    this.rows = raw;
  }

  get = (rowIndex: number, columnIndex?: number) => {
    const row = this.rows.at(rowIndex);
    if (!row) {
      throw new Error(`No table row found at index ${rowIndex}`);
    }
    if (columnIndex) {
      const cell = row.at(columnIndex);
      if (!cell) {
        throw new Error(`No table cell found at index ${rowIndex}, ${columnIndex}`);
      }
      return cell;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return row as any;
  };
}
