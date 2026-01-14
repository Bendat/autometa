import { applyTransformers } from "./coercion";
import { mapRecordsToInstances, mapRecordsWithMapper } from "./record-mapper";
import type {
  CellContext,
  HorizontalTableOptions,
  ResolveOptions,
  TableShape,
  TableTransformer,
  TableValue,
  TableInstanceFactory,
  TableInstanceOptions,
  TableRecord,
  TableRowMapper,
} from "./types";

const SHAPE: TableShape = "horizontal";

export class HorizontalTable {
  private readonly headers: readonly string[];
  private readonly rows: readonly (readonly string[])[];
  private readonly headerMap: ReadonlyMap<string, number>;
  private readonly options: Required<Omit<HorizontalTableOptions, "transformers">> & {
    readonly transformers: Readonly<Record<string, TableTransformer>>;
  };

  constructor(
    data: readonly (readonly string[])[],
    options: HorizontalTableOptions = {}
  ) {
    if (data.length === 0) {
      throw new TypeError("Horizontal tables require at least one header row.");
    }
    const headerRow = data[0];
    if (!headerRow) {
      throw new TypeError("Horizontal tables require a defined header row.");
    }
    this.headers = [...headerRow];
    const rows = data.slice(1);
    this.rows = rows.map((row) => [...row]) as readonly (readonly string[])[];
    this.headerMap = new Map(this.headers.map((header, index) => [header, index]));
    this.options = {
      coerce: options.coerce ?? true,
      transformers: options.transformers ?? {},
    };
  }

  headerNames(): readonly string[] {
    return this.headers;
  }

  rowCount(): number {
    return this.rows.length;
  }

  columnCount(): number {
    return this.headers.length;
  }

  getRow(rowIndex: number, options?: ResolveOptions): Record<string, TableValue> {
    const source = this.rows[rowIndex];
    if (!source) {
      return {};
    }
    const record: Record<string, TableValue> = {};
    this.headers.forEach((header, columnIndex) => {
      const rawValue = source[columnIndex] ?? "";
      record[header] = this.resolve(header, rawValue, rowIndex, columnIndex, options);
    });
    return record;
  }

  getRows(options?: ResolveOptions): Record<string, TableValue>[] {
    return this.rows.map((_, rowIndex) => this.getRow(rowIndex, options));
  }

  records<T extends TableRecord = TableRecord>(options?: ResolveOptions): T[] {
    return this.getRows(options) as T[];
  }

  mapRecords<T>(mapper: TableRowMapper<T>, options?: ResolveOptions): T[] {
    const rows = this.getRows(options);
    return mapRecordsWithMapper(rows, SHAPE, mapper);
  }

  asInstances<T>(
    factory: TableInstanceFactory<T>,
    options?: TableInstanceOptions<T> & { readonly resolve?: ResolveOptions }
  ): T[] {
    const { resolve, ...rest } = options ?? {};
    const rows = this.getRows(resolve);
    return mapRecordsToInstances(rows, SHAPE, factory, rest as TableInstanceOptions<T>);
  }

  toInstances<T>(
    factory: TableInstanceFactory<T>,
    options?: TableInstanceOptions<T> & { readonly resolve?: ResolveOptions }
  ): T[] {
    return this.asInstances(factory, options);
  }

  getColumn(header: string, options?: ResolveOptions): TableValue[] {
    const columnIndex = this.headerMap.get(header);
    if (columnIndex === undefined) {
      return [];
    }
    return this.rows.map((row, rowIndex) =>
      this.resolve(header, row[columnIndex] ?? "", rowIndex, columnIndex, options)
    );
  }

  getCell(
    header: string,
    rowIndex: number,
    options?: ResolveOptions
  ): TableValue | undefined {
    const columnIndex = this.headerMap.get(header);
    if (columnIndex === undefined) {
      return undefined;
    }
    const row = this.rows[rowIndex];
    if (!row) {
      return undefined;
    }
    const value = row[columnIndex];
    if (value === undefined) {
      return undefined;
    }
    return this.resolve(header, value, rowIndex, columnIndex, options);
  }

  getCellOrThrow(
    header: string,
    rowIndex: number,
    options?: ResolveOptions
  ): TableValue {
    const value = this.getCell(header, rowIndex, options);
    if (value === undefined) {
      throw new RangeError(
        `Cell '${header}' at row ${rowIndex} does not exist in a horizontal table.`
      );
    }
    return value;
  }

  raw(): readonly (readonly string[])[] {
    return [this.headers, ...this.rows];
  }

  *[Symbol.iterator](): IterableIterator<TableRecord> {
    for (const record of this.records()) {
      yield record;
    }
  }

  private resolve(
    header: string,
    rawValue: string,
    rowIndex: number,
    columnIndex: number,
    options?: ResolveOptions
  ): TableValue {
    if (options?.raw === true) {
      return rawValue;
    }
    const transformer = this.options.transformers[header];
    const context: CellContext = {
      shape: SHAPE,
      header,
      rowIndex,
      columnIndex,
      raw: rawValue,
    };
    const shouldCoerce = options?.coerce ?? this.options.coerce;
    return applyTransformers(rawValue, context, transformer, shouldCoerce);
  }
}
