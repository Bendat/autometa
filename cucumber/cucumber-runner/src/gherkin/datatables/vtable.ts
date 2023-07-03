import { transformTableValue } from './transform-table-value';
import { ParsedDataTable } from "./datatable";
import { JsonTableRow } from "./json-table-row";
import type { CompiledDataTable } from "./table-type";
import type { TableValue } from "./table-value";
interface IVTable {
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
export class VTable extends ParsedDataTable implements IVTable {
  readonly headers: string[];
  readonly rows: TableValue[][];
  #headerMapping: { [key: string]: number } = {};

  constructor(protected raw: CompiledDataTable) {
    super();
    this.headers = raw.map(([title]) => title);
    this.rows = raw.map(([_, ...rows]) => rows.map(transformTableValue));
    const mapHeaders = (header: string, idx: number) => {
      this.#headerMapping[header] = idx;
    };
    this.headers.forEach(mapHeaders);
  }

  get = (header: string, indexOrRaw?: number | boolean, raw?: boolean) => {
    let index: number | null | undefined;
    let getRaw = raw;
    if (typeof indexOrRaw === 'boolean') {
      getRaw = indexOrRaw;
    } else {
      index = indexOrRaw;
    }
    const rows = getRaw ? this.raw.map(([_, ...rows]) => rows) : this.rows;
    const colIdx = this.#headerMapping[header];
    const col = rows[colIdx];
    if (index !== null && index != undefined) {
      const found = col.at(index);
      if (found === undefined || found === null) {
        throw new Error(`Column ${index} does not exist. This table has ${col.length} columns.`);
      }
      return found;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return col as any;
  };
  tryGet = (header: string, indexOrRaw?: number | boolean, raw?: boolean) => {
    let index: number | null | undefined;
    let getRaw = raw;
    if (typeof indexOrRaw === 'boolean') {
      getRaw = indexOrRaw;
    } else {
      index = indexOrRaw;
    }
    const rows = getRaw ? this.raw.map(([_, ...rows]) => rows) : this.rows;
    const colIdx = this.#headerMapping[header];
    const col = rows[colIdx];
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
    const rows = raw ? this.raw.map(([_, ...rows]) => rows) : this.rows
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
    const rows = raw ? this.raw.map(([_, ...rows]) => rows) : this.rows
    return rows.map((row) => {
      const col = row.at(number);
      if (!col) {
        throw new Error(`Column ${number} does not exist. This table has ${row.length} rows.`);
      }
      return col;
    });
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
  toList(raw?: boolean) {
    const rows = raw ? this.raw.map(([_, ...rows]) => rows) : this.rows
    const raws = rows.map((values, idx) => {
      return values.map((value) => {
        const header = this.headers[idx];
        return { [header]: value };
      });
    });
    const length = raws[0]?.length ?? 0;
    const objects: { [name: string]: unknown }[] = [];
    for (let count = 0; count < length; count++) {
      let obj: { [name: string]: unknown } = {};
      for (let i = 0; i < raws.length; i++) {
        const first = raws[i].shift();
        obj = { ...obj, ...first };
      }
      objects.push(obj);
    }

    return objects;
  }
}
