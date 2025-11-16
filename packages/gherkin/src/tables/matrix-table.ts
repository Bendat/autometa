import { applyTransformers } from "./coercion";
import type {
  CellContext,
  MatrixCellTransformers,
  MatrixTableOptions,
  ResolveOptions,
  TableShape,
  TableTransformer,
  TableValue,
} from "./types";

const SHAPE: TableShape = "matrix";

type CellTransforms = Required<MatrixCellTransformers>;

export class MatrixTable {
  private readonly horizontalHeaders: readonly string[];
  private readonly verticalHeaders: readonly string[];
  private readonly grid: readonly (readonly string[])[];
  private readonly options: Required<Omit<MatrixTableOptions, "transformers">> & {
    readonly transformers: CellTransforms;
  };

  constructor(
    data: readonly (readonly string[])[],
    options: MatrixTableOptions = {}
  ) {
    if (data.length === 0) {
      throw new TypeError("Matrix tables require at least a header row.");
    }
    const headerRow = data[0];
    if (!headerRow) {
      throw new TypeError("Matrix tables require defined headers.");
    }
    this.horizontalHeaders = headerRow.slice(1).map(String);
    this.verticalHeaders = data.slice(1).map((row) => String(row[0] ?? ""));
    this.grid = data
      .slice(1)
      .map((row) => row.slice(1)) as readonly (readonly string[])[];

    this.options = {
      coerce: options.coerce ?? true,
      transformers: {
        rows: options.transformers?.rows ?? {},
        columns: options.transformers?.columns ?? {},
        cells: options.transformers?.cells ?? {},
      },
    };
  }

  horizontal(): readonly string[] {
    return this.horizontalHeaders;
  }

  vertical(): readonly string[] {
    return this.verticalHeaders;
  }

  getRow(header: string, options?: ResolveOptions): Record<string, TableValue> {
    const rowIndex = this.verticalHeaders.indexOf(header);
    if (rowIndex === -1) {
      return {};
    }
    const rowData = this.grid[rowIndex] ?? [];
    const record: Record<string, TableValue> = {};
    this.horizontalHeaders.forEach((hHeader, columnIndex) => {
      const rawValue = rowData[columnIndex] ?? "";
      record[hHeader] = this.resolve(
        header,
        hHeader,
        rawValue,
        rowIndex,
        columnIndex,
        options
      );
    });
    return record;
  }

  getColumn(header: string, options?: ResolveOptions): Record<string, TableValue> {
    const columnIndex = this.horizontalHeaders.indexOf(header);
    if (columnIndex === -1) {
      return {};
    }
    const record: Record<string, TableValue> = {};
    this.verticalHeaders.forEach((vHeader, rowIndex) => {
      const rowData = this.grid[rowIndex] ?? [];
      const rawValue = rowData[columnIndex] ?? "";
      record[vHeader] = this.resolve(
        vHeader,
        header,
        rawValue,
        rowIndex,
        columnIndex,
        options
      );
    });
    return record;
  }

  getCell(
    verticalHeader: string,
    horizontalHeader: string,
    options?: ResolveOptions
  ): TableValue | undefined {
    const rowIndex = this.verticalHeaders.indexOf(verticalHeader);
    const columnIndex = this.horizontalHeaders.indexOf(horizontalHeader);
    if (rowIndex === -1 || columnIndex === -1) {
      return undefined;
    }
    const row = this.grid[rowIndex];
    const rawValue = row?.[columnIndex];
    if (rawValue === undefined) {
      return undefined;
    }
    return this.resolve(
      verticalHeader,
      horizontalHeader,
      rawValue,
      rowIndex,
      columnIndex,
      options
    );
  }

  getCellOrThrow(
    verticalHeader: string,
    horizontalHeader: string,
    options?: ResolveOptions
  ): TableValue {
    const value = this.getCell(verticalHeader, horizontalHeader, options);
    if (value === undefined) {
      throw new RangeError(
        `Matrix cell '${verticalHeader}' x '${horizontalHeader}' does not exist.`
      );
    }
    return value;
  }

  raw(): readonly (readonly string[])[] {
    return [
      ["", ...this.horizontalHeaders],
      ...this.verticalHeaders.map((header, rowIndex) => [
        header,
        ...(this.grid[rowIndex] ?? []),
      ]),
    ];
  }

  private resolve(
    verticalHeader: string,
    horizontalHeader: string,
    rawValue: string,
    rowIndex: number,
    columnIndex: number,
    options?: ResolveOptions
  ): TableValue {
    if (options?.raw === true) {
      return rawValue;
    }
    const transformer = this.selectTransformer(
      verticalHeader,
      horizontalHeader
    );
    const context: CellContext = {
      shape: SHAPE,
      header: horizontalHeader,
      verticalHeader,
      rowIndex,
      columnIndex,
      raw: rawValue,
    };
    const shouldCoerce = options?.coerce ?? this.options.coerce;
    return applyTransformers(rawValue, context, transformer, shouldCoerce);
  }

  private selectTransformer(
    verticalHeader: string,
    horizontalHeader: string
  ): TableTransformer | undefined {
    const cellTransformer = this.options.transformers.cells[verticalHeader]?.[
      horizontalHeader
    ];
    if (cellTransformer) {
      return cellTransformer;
    }
    const rowTransformer = this.options.transformers.rows[verticalHeader];
    if (rowTransformer) {
      return rowTransformer;
    }
    return this.options.transformers.columns[horizontalHeader];
  }
}
