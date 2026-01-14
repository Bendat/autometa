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
  private readonly rowKeys: Readonly<Record<string, string>>;
  private readonly columnKeys: Readonly<Record<string, string>>;
  private readonly rowHeaderByKey: ReadonlyMap<string, string>;
  private readonly columnHeaderByKey: ReadonlyMap<string, string>;
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

    const keys = (options as {
      readonly keys?: {
        readonly rows?: Readonly<Record<string, string>>;
        readonly columns?: Readonly<Record<string, string>>;
      };
    }).keys;
    this.rowKeys = keys?.rows ?? {};
    this.columnKeys = keys?.columns ?? {};
    this.rowHeaderByKey = new Map(
      this.buildReverseKeyMap("Matrix row", this.verticalHeaders, this.rowKeys)
    );
    this.columnHeaderByKey = new Map(
      this.buildReverseKeyMap(
        "Matrix column",
        this.horizontalHeaders,
        this.columnKeys
      )
    );

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
    const resolvedRowHeader = this.resolveVerticalHeader(header);
    if (!resolvedRowHeader) {
      return {};
    }
    const rowIndex = this.verticalHeaders.indexOf(resolvedRowHeader);
    if (rowIndex === -1) {
      return {};
    }
    const rowData = this.grid[rowIndex] ?? [];
    const record: Record<string, TableValue> = {};
    this.horizontalHeaders.forEach((hHeader, columnIndex) => {
      const rawValue = rowData[columnIndex] ?? "";
      const key = this.keyForHorizontalHeader(hHeader);
      record[key] = this.resolve(
        resolvedRowHeader,
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
    const resolvedColumnHeader = this.resolveHorizontalHeader(header);
    if (!resolvedColumnHeader) {
      return {};
    }
    const columnIndex = this.horizontalHeaders.indexOf(resolvedColumnHeader);
    if (columnIndex === -1) {
      return {};
    }
    const record: Record<string, TableValue> = {};
    this.verticalHeaders.forEach((vHeader, rowIndex) => {
      const rowData = this.grid[rowIndex] ?? [];
      const rawValue = rowData[columnIndex] ?? "";
      const key = this.keyForVerticalHeader(vHeader);
      record[key] = this.resolve(
        vHeader,
        resolvedColumnHeader,
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
    const resolvedRowHeader = this.resolveVerticalHeader(verticalHeader);
    const resolvedColumnHeader = this.resolveHorizontalHeader(horizontalHeader);
    if (!resolvedRowHeader || !resolvedColumnHeader) {
      return undefined;
    }

    const rowIndex = this.verticalHeaders.indexOf(resolvedRowHeader);
    const columnIndex = this.horizontalHeaders.indexOf(resolvedColumnHeader);
    if (rowIndex === -1 || columnIndex === -1) {
      return undefined;
    }
    const row = this.grid[rowIndex];
    const rawValue = row?.[columnIndex];
    if (rawValue === undefined) {
      return undefined;
    }
    return this.resolve(
      resolvedRowHeader,
      resolvedColumnHeader,
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
    const vKey = this.keyForVerticalHeader(verticalHeader);
    const hKey = this.keyForHorizontalHeader(horizontalHeader);

    const cells = this.options.transformers.cells;
    const rows = this.options.transformers.rows;
    const columns = this.options.transformers.columns;

    // Cell-specific (most specific)
    return (
      cells[vKey]?.[hKey] ??
      cells[vKey]?.[horizontalHeader] ??
      cells[verticalHeader]?.[hKey] ??
      cells[verticalHeader]?.[horizontalHeader] ??
      // Row-wide
      rows[vKey] ??
      rows[verticalHeader] ??
      // Column-wide
      columns[hKey] ??
      columns[horizontalHeader]
    );
  }

  private keyForVerticalHeader(header: string): string {
    return this.rowKeys[header] ?? header;
  }

  private keyForHorizontalHeader(header: string): string {
    return this.columnKeys[header] ?? header;
  }

  private resolveVerticalHeader(headerOrKey: string): string | undefined {
    if (this.verticalHeaders.includes(headerOrKey)) {
      return headerOrKey;
    }
    return this.rowHeaderByKey.get(headerOrKey);
  }

  private resolveHorizontalHeader(headerOrKey: string): string | undefined {
    if (this.horizontalHeaders.includes(headerOrKey)) {
      return headerOrKey;
    }
    return this.columnHeaderByKey.get(headerOrKey);
  }

  private buildReverseKeyMap(
    label: string,
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
          `${label} keys mapping is not unique: multiple headers map to '${key}'.`
        );
      }
      usedKeys.add(key);
      reverse.push([key, header]);
    }
    return reverse;
  }
}
