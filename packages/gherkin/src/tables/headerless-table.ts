import { applyTransformers } from "./coercion";
import type {
  CellContext,
  HeaderlessTableOptions,
  ResolveOptions,
  TableShape,
  TableTransformer,
  TableValue,
} from "./types";

const SHAPE: TableShape = "headerless";

export class HeaderlessTable {
  private readonly rawTable: readonly (readonly string[])[];
  private readonly options: Required<Omit<HeaderlessTableOptions, "transformers">> & {
    readonly transformers: Readonly<Record<number, TableTransformer>>;
  };

  constructor(
    rows: readonly (readonly string[])[],
    options: HeaderlessTableOptions = {}
  ) {
    this.rawTable = rows.map((row) => [...row]) as readonly (readonly string[])[];
    this.options = {
      coerce: options.coerce ?? false,
      transformers: options.transformers ?? {},
    };
  }

  rowCount(): number {
    return this.rawTable.length;
  }

  columnCount(): number {
    return this.rawTable.reduce((max, row) => Math.max(max, row.length), 0);
  }

  rows(options?: ResolveOptions): TableValue[][] {
    return this.rawTable.map((row, rowIndex) =>
      row.map((value, columnIndex) =>
        this.resolve(value, rowIndex, columnIndex, options)
      )
    );
  }

  row(rowIndex: number, options?: ResolveOptions): TableValue[] {
    const row = this.rawTable[rowIndex];
    if (!row) {
      return [];
    }
    return row.map((value, columnIndex) =>
      this.resolve(value, rowIndex, columnIndex, options)
    );
  }

  cell(
    rowIndex: number,
    columnIndex: number,
    options?: ResolveOptions
  ): TableValue | undefined {
    const row = this.rawTable[rowIndex];
    if (!row) {
      return undefined;
    }
    const value = row[columnIndex];
    if (value === undefined) {
      return undefined;
    }
    return this.resolve(value, rowIndex, columnIndex, options);
  }

  cellOrThrow(
    rowIndex: number,
    columnIndex: number,
    options?: ResolveOptions
  ): TableValue {
    const value = this.cell(rowIndex, columnIndex, options);
    if (value === undefined) {
      throw new RangeError(
        `Table cell [${rowIndex}, ${columnIndex}] does not exist in a headerless table.`
      );
    }
    return value;
  }

  raw(): readonly (readonly string[])[] {
    return this.rawTable;
  }

  private resolve(
    rawValue: string,
    rowIndex: number,
    columnIndex: number,
    options?: ResolveOptions
  ): TableValue {
    if (options?.raw === true) {
      return rawValue;
    }
    const transformer = this.options.transformers[columnIndex];
    const context: CellContext = {
      shape: SHAPE,
      rowIndex,
      columnIndex,
      raw: rawValue,
    };
    const shouldCoerce = options?.coerce ?? this.options.coerce;
    return applyTransformers(rawValue, context, transformer, shouldCoerce);
  }
}
