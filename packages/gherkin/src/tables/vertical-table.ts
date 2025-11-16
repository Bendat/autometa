import { applyTransformers } from "./coercion";
import type {
  CellContext,
  ResolveOptions,
  TableShape,
  TableTransformer,
  TableValue,
  VerticalTableOptions,
} from "./types";

const SHAPE: TableShape = "vertical";

export class VerticalTable {
  private readonly headers: readonly string[];
  private readonly columns: readonly (readonly string[])[];
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
    const headerIndex = this.headers.indexOf(header);
    if (headerIndex === -1) {
      return [];
    }
    return this.columns[headerIndex]?.map((value, columnIndex) =>
      this.resolve(header, value, headerIndex, columnIndex, options)
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
        record[header] = this.resolve(header, rawValue, headerIndex, index, options);
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

  getCell(
    header: string,
    index: number,
    options?: ResolveOptions
  ): TableValue | undefined {
    const headerIndex = this.headers.indexOf(header);
    if (headerIndex === -1) {
      return undefined;
    }
    const column = this.columns[headerIndex];
    const rawValue = column?.[index];
    if (rawValue === undefined) {
      return undefined;
    }
    return this.resolve(header, rawValue, headerIndex, index, options);
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
