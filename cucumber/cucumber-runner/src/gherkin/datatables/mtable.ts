import { transformTableValue } from './transform-table-value';
import { ParsedDataTable } from "./datatable";
import { CompiledDataTable } from "./table-type";
import { TableValue } from "./table-value";
type HeaderMapping = { [key: string]: number };
interface IMTable {
  /**
   * Retrieves a row of the table by its vertical title.
   * ```
   * |        | white | blue |
   * | large  | sun   | ocean   |
   * | small  | egg   | ball   |
   * ```
   *
   * ```ts
   * table.get('large'); // ['sun', 'ocean']
   * ```
   * @param verticalHeader
   */
  get(verticalHeader: string): TableValue[];
  /**
   * Gets a cell of the table by its vertical and horizontal
   * headers.
   * ```
   * |        | white | blue   |
   * | large  | sun   | ocean  |
   * | small  | egg   | ball   |
   * ```
   *
   * ```ts
   * table.get('large', 'white'); // 'sun'
   * ```
   * @param verticalHeader
   * @param horizontalHeader
   */
  get(verticalHeader: string, horizontalHeader: string): TableValue;
  get(verticalHeader: string, horizontalHeader?: string): TableValue;
  /**
   * @param header The column title to collect
   * @param raw Recover raw data without type transformation.
   */
  get(header: string, raw?: boolean): TableValue;
  /**
   * @param header The column title to collect
   * @param horizontalHeader The cells row-index of that column to retrieve.
   * @param raw Recover raw data without type transformation.
   */
  get(header: string, horizontalHeader?: string, raw?: boolean): TableValue;
}

/**
 * Represents a datatable with a bidirectional relationship
 * between headers.
 * ```
 *  |       | white | blue  |
 *  | large | sun   | ocean |
 *  | small | egg   | ball  |
 * ```
 *
 * Where the first (top left) cell is ignored, the first horizontal
 * row is treated as the horizontal headers, and the first column
 * are the vertical headers.
 *
 * A cell can be accessed by its vertical and horizontal headers.
 */
export class MTable extends ParsedDataTable implements IMTable {
  private readonly vheaders: string[];
  private readonly vheaderMappings: HeaderMapping = {};
  private readonly hheaderMappings: HeaderMapping = {};
  private readonly hheaders: string[];
  private readonly rows: TableValue[][];
  constructor(protected raw: CompiledDataTable) {
    super();
    this.vheaders = raw.slice(1, raw.length).map(([title]) => title as string);
    const row = raw.at(0) ?? [];
    this.hheaders = row.slice(1, row.length).map((it) => it as string) ?? [];
    this.rows = raw.slice(1, raw.length).map((row) => row.slice(1, row.length).map(transformTableValue));
    const mapHeaders = (collection: HeaderMapping) => (header: string, idx: number) => {
      collection[header] = idx;
    };
    this.vheaders.forEach(mapHeaders(this.vheaderMappings));
    this.hheaders.forEach(mapHeaders(this.hheaderMappings));
  }

  get = (verticalHeader: string, horizontalHeaderOrRaw?: string | boolean, raw?: boolean) => {
    let getRaw = raw;
    if (typeof horizontalHeaderOrRaw === 'boolean') {
      getRaw = horizontalHeaderOrRaw;
    }
    const rows = getRaw ? this.raw.slice(1, this.raw.length).map((row) => row.slice(1, row.length)) : this.rows
    const vIndex = this.vheaderMappings[verticalHeader];
    const row = rows[vIndex];
    if (typeof horizontalHeaderOrRaw === 'string') {
      const hIndex = this.hheaderMappings[horizontalHeaderOrRaw];
      return  row[hIndex];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return row as any;
  };

  col = (horizontalHeader: string, raw?: boolean) => {
    const rows = raw ? this.raw.slice(1, this.raw.length).map((row) => row.slice(1, row.length)) : this.rows
    const hIndex = this.hheaderMappings[horizontalHeader];
    return  rows.map((it) => it.at(hIndex)) as TableValue[];
  };
}
