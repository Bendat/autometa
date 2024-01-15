import { TableValue } from "../table-value";
import { CompiledDataTable } from "../compiled-data-table";
import { DataTable, mapHeaders } from "./data-table";
import { AutomationError } from "@autometa/errors";

/**
 * A matrix table is a table where the first row and column are headers,
 * and each intersecting cell is a value.
 *
 * For example:
 *
 * ```gherkin
 * Given I have a Table
 *  |           | HHEader1 | HHeader2 | HHeader 3 |
 *  | VHeader 1 | Value 4  | Value 5  | Value 6   |
 *  | VHeader 2 | Value 7  | Value 8  | Value 9   |
 * ```
 */
export class MTable extends DataTable {
  private vheaders: { [header: string]: number };
  private hheaders: { [header: string]: number };
  private rows: TableValue[][];
  private raw: string[][];

  protected construct({ table, raw }: CompiledDataTable): void {
    const vheaders = raw.slice(1, raw.length).map(([title]) => title as string);
    const row = raw.at(0) ?? [];
    const hheaders = row.slice(1, row.length).map((it) => it as string) ?? [];
    this.vheaders = mapHeaders(vheaders);
    this.hheaders = mapHeaders(hheaders);
    this.rows = table
      .slice(1, raw.length)
      .map((row) => row.slice(1, row.length));
    this.raw = raw;
  }
  get count(): number {
    throw new Error("MTable is not countable and cannot be used with documents");
  }

  /**
   * Retrieves a value from a specific table cell using
   * the header and row index.
   *
   * By default the value will be coerced to it's typescript type,
   * i.e a value '1' in a table cell will be coerced into a number,
   * 'true' to a boolean, etc.
   *
   * @param vheader
   * @param hheader
   */
  get<TReturn = TableValue>(vheader: string, hheader: string): TReturn;
  get<TReturn = TableValue>(
    vheader: string,
    hheader?: string
  ): TReturn | TReturn[] {
    const vIdx = this.vheaders[vheader];
    if (hheader === undefined) {
      return this.rows[vIdx] as TReturn[];
    }
    const hIdx = this.hheaders[hheader];

    return this.rows[vIdx][hIdx] as TReturn;
  }

  /**
   * Retrieves a row from the table by it's vertical header.
   */
  getRow<T extends [...TableValue[]] = [...TableValue[]]>(
    vheader: TableValue
  ): T {
    const vIdx = this.vheaders[String(vheader)];
    return this.rows[vIdx] as T;
  }

  /**
   * Retrieves a column from the table by it's horizontal header.
   */
  getColumn<T extends [...TableValue[]] = [...TableValue[]]>(
    hheader: TableValue
  ): T {
    const hIdx = this.hheaders[String(hheader)];
    return this.rows.map((row) => row[hIdx]) as T;
  }

  getOrThrow<TReturn = TableValue>(
    vheader: TableValue,
    hheader: TableValue
  ): TReturn;
  getOrThrow<TReturn = TableValue>(vheader: TableValue, hheader: TableValue) {
    const vIdx = this.vheaders[String(vheader)];
    const hIdx = this.hheaders[String(hheader)];
    const vert = this.rows[vIdx];
    if (vert === undefined) {
      throw new AutomationError(`Could not find vertical title ${vheader}`);
    }
    const hor = vert[hIdx] as TReturn;
    if (hor === undefined) {
      throw new AutomationError(
        `Could not find horizontal title ${hheader} from vertical title ${vheader}`
      );
    }
    return hor;
  }

  asJson(): Record<string | number, TableValue[]> {
    const json: Record<string, TableValue[]> = {};
    for (let i = 0; i < this.raw[0].length; i++) {
      const header = this.raw[0][i];
      // collect columns into array and attach to json
      json[header] = this.raw.slice(1).map((row) => row[i]);
    }
    return json;
  }
}
