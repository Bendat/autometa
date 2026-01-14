import { applyTransformers } from "./coercion";
import { mapRecordsToInstances, mapRecordsWithMapper } from "./record-mapper";
import type {
  CellContext,
  ResolveOptions,
  TableShape,
  TableTransformer,
  TableValue,
  VerticalTableOptions,
  TableInstanceFactory,
  TableInstanceOptions,
  TableRecord,
  TableRowMapper,
} from "./types";

const SHAPE: TableShape = "vertical";

export class VerticalTable {
  private readonly headers: readonly string[];
  private readonly columns: readonly (readonly string[])[];
  private readonly headerByKey: ReadonlyMap<string, string>;
  private readonly keys: Readonly<Record<string, string>>;
  private readonly options: Required<Omit<VerticalTableOptions, "transformers">> & {
    readonly transformers: Readonly<Record<string, TableTransformer>>;
  };

  constructor(
    data: readonly (readonly string[])[],
    options: VerticalTableOptions = {}
  ) {
    if (data.length === 0) {
      throw new TypeError("Vertical tables require at least one row.");
    }
    this.headers = data.map((row) => String(row[0] ?? ""));
    this.columns = data.map((row) => row.slice(1)) as readonly (readonly string[])[];

    this.keys = (options as { readonly keys?: Readonly<Record<string, string>> }).keys ?? {};
    this.headerByKey = new Map(this.buildReverseKeyMap(this.headers, this.keys));

    this.options = {
      coerce: options.coerce ?? true,
      transformers: options.transformers ?? {},
    };
  }

  headerNames(): readonly string[] {
    return this.headers;
  }

  entryCount(): number {
    return this.columns.reduce((max, column) => Math.max(max, column.length), 0);
  }

  getSeries(header: string, options?: ResolveOptions): TableValue[] {
    const resolvedHeader = this.resolveHeader(header);
    if (!resolvedHeader) {
      return [];
    }
    const headerIndex = this.headers.indexOf(resolvedHeader);
    if (headerIndex === -1) {
      return [];
    }
    return this.columns[headerIndex]?.map((value, columnIndex) =>
      this.resolve(resolvedHeader, value, headerIndex, columnIndex, options)
    ) ?? [];
  }

  getSeriesOrThrow(header: string, options?: ResolveOptions): TableValue[] {
    const series = this.getSeries(header, options);
    if (series.length === 0) {
      throw new RangeError(`Vertical table header '${header}' does not exist.`);
    }
    return series;
  }

  getRecord(index: number, options?: ResolveOptions): Record<string, TableValue> {
    const record: Record<string, TableValue> = {};
    this.headers.forEach((header, headerIndex) => {
      const column = this.columns[headerIndex];
      const rawValue = column?.[index];
      if (rawValue !== undefined) {
        const key = this.keyForHeader(header);
        record[key] = this.resolve(header, rawValue, headerIndex, index, options);
      }
    });
    return record;
  }

  getRecords(options?: ResolveOptions): Record<string, TableValue>[] {
    const size = this.entryCount();
    const records: Record<string, TableValue>[] = [];
    for (let index = 0; index < size; index++) {
      records.push(this.getRecord(index, options));
    }
    return records;
  }

  records<T extends TableRecord = TableRecord>(options?: ResolveOptions): T[] {
    return this.getRecords(options) as T[];
  }

  mapRecords<T>(mapper: TableRowMapper<T>, options?: ResolveOptions): T[] {
    const records = this.getRecords(options);
    return mapRecordsWithMapper(records, SHAPE, mapper);
  }

  asInstances<T>(
    factory: TableInstanceFactory<T>,
    options?: TableInstanceOptions<T> & { readonly resolve?: ResolveOptions }
  ): T[] {
    const { resolve, ...rest } = options ?? {};
    const records = this.getRecords(resolve);
    return mapRecordsToInstances(records, SHAPE, factory, rest as TableInstanceOptions<T>);
  }

  toInstances<T>(
    factory: TableInstanceFactory<T>,
    options?: TableInstanceOptions<T> & { readonly resolve?: ResolveOptions }
  ): T[] {
    return this.asInstances(factory, options);
  }

  getCell(
    header: string,
    index: number,
    options?: ResolveOptions
  ): TableValue | undefined {
    const resolvedHeader = this.resolveHeader(header);
    if (!resolvedHeader) {
      return undefined;
    }
    const headerIndex = this.headers.indexOf(resolvedHeader);
    if (headerIndex === -1) {
      return undefined;
    }
    const column = this.columns[headerIndex];
    const rawValue = column?.[index];
    if (rawValue === undefined) {
      return undefined;
    }
    return this.resolve(resolvedHeader, rawValue, headerIndex, index, options);
  }

  getCellOrThrow(
    header: string,
    index: number,
    options?: ResolveOptions
  ): TableValue {
    const value = this.getCell(header, index, options);
    if (value === undefined) {
      throw new RangeError(
        `Cell '${header}' at index ${index} does not exist in a vertical table.`
      );
    }
    return value;
  }

  raw(): readonly (readonly string[])[] {
    return this.headers.map((header, index) => [
      header,
      ...(this.columns[index] ?? []),
    ]);
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
    const key = this.keyForHeader(header);
    const transformer = this.options.transformers[key] ?? this.options.transformers[header];
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

  private keyForHeader(header: string): string {
    return this.keys[header] ?? header;
  }

  private resolveHeader(headerOrKey: string): string | undefined {
    if (this.headers.includes(headerOrKey)) {
      return headerOrKey;
    }
    return this.headerByKey.get(headerOrKey);
  }

  private buildReverseKeyMap(
    headers: readonly string[],
    keys: Readonly<Record<string, string>>
  ): Array<[string, string]> {
    const reverse: Array<[string, string]> = [];
    const usedKeys = new Set<string>();
    for (const header of headers) {
      const key = keys[header];
      if (!key) {
        continue;
      }
      if (usedKeys.has(key)) {
        throw new RangeError(
          `Vertical table keys mapping is not unique: multiple headers map to '${key}'.`
        );
      }
      usedKeys.add(key);
      reverse.push([key, header]);
    }
    return reverse;
  }
}
