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
    this.rows = raw.slice(1, raw.length).map((row) => row.slice(1, row.length));
    const mapHeaders = (collection: HeaderMapping) => (header: string, idx: number) => {
      collection[header] = idx;
    };
    this.vheaders.forEach(mapHeaders(this.vheaderMappings));
    this.hheaders.forEach(mapHeaders(this.hheaderMappings));
  }

  get = (verticalHeader: string, horizontalHeader?: string) => {
    const vIndex = this.vheaderMappings[verticalHeader];
    const row = this.rows[vIndex];
    if (horizontalHeader) {
      const hIndex = this.hheaderMappings[horizontalHeader];
      const cell = row[hIndex];
      return cell;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return row as any;
  };

  col = (horizontalHeader: string) => {
    const hIndex = this.hheaderMappings[horizontalHeader];
    const col = this.rows.map((it) => it.at(hIndex)) as TableValue[];
    return col;
  };
}
