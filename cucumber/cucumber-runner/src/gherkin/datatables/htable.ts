import { transformTableValue } from "./transform-table-value";
import { ParsedDataTable } from "./datatable";
import { JsonTableRow } from "./json-table-row";
import { CompiledDataTable } from "./table-type";
import { TableValue } from "./table-value";
interface IHTable {
  /**
   * Get a column (array) of Table Values based
   * on there title.
   *
   * ```ts
   * table.get('name'); // ['John', 'Burt']
   * ```
   * @param header The column title  to collect
   */
  get(header: string): TableValue[];
  /**
   * Get a cell by its title and row index.
   * ```ts
   * table.get('name', 0); // 'John'
   * ```
   * @param header The column title to collect
   * @param index The cells row-index of that column to retrieve.
   */
  get(header: string, index: number): TableValue;
  get(header: string, index?: number): TableValue | TableValue[];
  /**
   * @param header The column title to collect
   * @param raw Recover raw data without type transformation.
   */
  get(header: string, raw?: boolean): TableValue | TableValue[];
  /**
   * @param header The column title to collect
   * @param index The cells row-index of that column to retrieve.
   * @param raw Recover raw data without type transformation.
   */
  get(header: string, index?: number, raw?: boolean): TableValue | TableValue[];
}
/**
 * Datatable Transformer that produces a
 * Horizontally titled group of columns, e.g.
 *
 * ```gherkin
 * Given a group of men
 *  | name | age | job    |
 *  | John | 46  | farmer |
 *  | Burt | 24  | doctor |
 * ```
 *
 * Where the first row is considered a header or
 * title for the column beneath.
 *
 * Cells of the table can be accessed by title, index,
 * or by coordinates.
 *
 * Primitive types will be transformed where possible,
 * so a cell which contains a numeric string (`| 123 |`)
 * will be converted to a number, and boolean strings (`| true | false |`)
 * into booleans. Otherwise it will remain a string. To bypass
 * transformation, wrap the value in quotes or double quites
 * (`| 'true' | "123" |`)
 */
export class HTable extends ParsedDataTable implements IHTable {
  readonly headers: string[];
  readonly rows: readonly TableValue[][];
  headerMapping: { [key: string]: number } = {};
  /**
   * Creates a new HorizontalTable from a raw
   * Gherkin {@link Datatable}.
   * @param raw The Datatable to transform
   */
  constructor(protected raw: CompiledDataTable) {
    super();
    [this.headers, ...this.rows] = raw;
    const mapHeaders = (header: string, idx: number) => {
      this.headerMapping[header] = idx;
    };
    this.headers.forEach(mapHeaders);
    const [_headers, ...rows] = [...raw];
    this.rows = rows.map((row) => row.map(transformTableValue));
  }
  get = (header: string, indexOrRaw?: number | boolean, raw?: boolean) => {
    let index: number | null | undefined;
    let getRaw = raw;
    if (typeof indexOrRaw === "boolean") {
      getRaw = indexOrRaw;
    } else {
      index = indexOrRaw;
    }
    const rows = getRaw ? this.raw.slice(1) : this.rows;
    const colIdx = this.headerMapping[header];
    const col = rows.map((row) => row[colIdx]);
    if (index !== null && index != undefined) {
      const found = col.at(index);
      if (!found) {
        throw new Error(`Column ${index} does not exist. This table has ${col.length} columns.`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return found as any;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return col as any;
  };
  tryGet = (header: string, indexOrRaw?: number | boolean, raw?: boolean) => {
    let index: number | null | undefined;
    let getRaw = raw;
    if (typeof indexOrRaw === "boolean") {
      getRaw = indexOrRaw;
    } else {
      index = indexOrRaw;
    }
    const rows = getRaw ? this.raw.slice(1) : this.rows;
    const colIdx = this.headerMapping[header];
    const col = rows.map((row) => row[colIdx]);
    if (index !== null && index != undefined) {
      return col.at(index);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return col as any;
  };
  /**
   * Return an entire row of the table by its index.
   * ```ts
   * // ---- cast to number ----v
   * table.row(0); // ['John', 46, 'farmer']
   * ```
   * @param number The index of the row to retrieve
   * @param raw Recover raw data without type transformation.
   * @returns A Tuple-like array of the values of a row
   */
  row(number: number, raw?: boolean): TableValue[] {
    const rows = raw ? this.raw.slice(1) : this.rows;
    const row = rows.at(number);
    if (!row) {
      throw new Error(`Row ${number} does not exist. This table has ${this.rows.length} rows.`);
    }
    return row;
  }
  /**
   * Return an entire column of the table by its index.
   * ```ts
   * // ---- cast to number ----v
   * table.col(0); // ['John', 'Burt']
   * ```
   * @param number The index of the column to retrieve
   * @param raw Recover raw data without type transformation.
   * @returns A Tuple-like array of the values of a column
   */
  col(number: number, raw?: boolean): TableValue[] {
    const rows = raw ? this.raw.slice(1) : this.rows;
    return rows.map((row) => {
      const col = row.at(number);
      if (!col) {
        throw new Error(`Column ${number} does not exist. This table has ${row.length} rows.`);
      }
      return col;
    });
  }
  /**
   * Finds a specific cell on the table
   * by it's x,y (row,col) coordinate
   * @param rowIdx the index of the row the cell is in
   * @param columnIdx the index of the column the cell is in
   * @param raw Recover raw data without type transformation.
   * @returns the value of the selected cell.
   */
  cell(rowIdx: number, columnIdx: number, raw?: boolean): TableValue {
    const cols = this.row(rowIdx, raw);
    const cell = cols.at(columnIdx);
    if (!cell) {
      throw new Error(
        `Cell [${columnIdx}, ${rowIdx}] does not exist. This table has ${this.rows.length} rows and ${cols.length} columns.`
      );
    }
    return cell;
  }
  /**
   * Converts one row of the table into
   * a json object, with each title a key
   * and its cell value a value.
   *
   * Numbers and bools will be parsed if possible.
   * @param rowIndex
   * @param raw Recover raw data without type transformation.
   * @returns
   */
  json<T extends JsonTableRow = JsonTableRow>(rowIndex: number, raw?: boolean): T {
    return this.toList(raw)[rowIndex] as T;
  }
  asJson(): Record<string, TableValue[]> {
    const json: Record<string, TableValue[]> = {};
    for (const header of this.headers) {
      this.headerMapping[header] = this.headers.indexOf(header);
      json[header] = this.get(header);
    }
    return json;
  }
  /**
   * Converts the content of the table
   * to an array of json objects, mapping
   * title to value
   * ```ts
   * [
   *   { name: 'John', age: 46, job: 'farmer' },
   *   { name: 'Burt', age: 24, job: 'doctor' },
   * ]
   * ```
   * @param raw Recover raw data without type transformation.
   * @returns the converted object array
   */
  toList(raw?: boolean): JsonTableRow[] {
    const rows = raw ? this.raw.slice(1) : this.rows;
    return rows.map((values) => {
      return values
        .map((value, idx) => {
          return { [this.headers[idx]]: value };
        })
        .reduce((obj, item) => ({ ...obj, ...item }), {});
    });
  }
}
