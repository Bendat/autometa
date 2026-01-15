export type TablePrimitive = string | number | boolean;

export type TableShape = "headerless" | "horizontal" | "vertical" | "matrix";

export interface ResolveOptions {
  readonly raw?: boolean;
  readonly coerce?: boolean;
}

export type TableRecord = Record<string, TableValue>;

export interface TableRowContext {
  readonly shape: TableShape;
  readonly rowIndex: number;
}

export type TableRowMapper<T> = (record: TableRecord, context: TableRowContext) => T;

export type TableInstanceFactory<T> =
  | (new () => T)
  | (() => T)
  | ((record: TableRecord, context: TableRowContext) => T);

export interface TableInstanceOptions<T> {
  readonly headerMap?: Readonly<Record<string, Extract<keyof T, string>>>;
  readonly normalizeHeader?: (header: string) => Extract<keyof T, string> | undefined;
  readonly strict?: boolean;
  readonly assign?: boolean;
  readonly apply?: (instance: T, record: TableRecord, context: TableRowContext) => void;
}

export interface CellContext {
  readonly shape: TableShape;
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly header?: string;
  readonly verticalHeader?: string;
  readonly raw: string;
}

export type TableTransformer = (value: string, context: CellContext) => unknown;

export type TableKeysMap = Readonly<Record<string, string>>;

type KeyValues<T extends TableKeysMap> = Extract<T[keyof T], string>;

type KeyedTransformers<K extends string> =
  // Keep backwards compatibility (any string key allowed)
  Readonly<Record<string, TableTransformer>> &
    // Provide autocomplete for known mapped keys
    Readonly<Partial<Record<K, TableTransformer>>>;

export interface HeaderlessTableOptions {
  readonly coerce?: boolean;
  readonly transformers?: Readonly<Record<number, TableTransformer>>;
}

export interface HorizontalTableOptions<TKeys extends TableKeysMap | undefined = undefined> {
  readonly coerce?: boolean;
  /**
   * Optional mapping from raw table headers (e.g. "Reports To") to record keys
   * (e.g. "reportsTo").
   */
  readonly keys?: TKeys;
  /**
   * Transformers keyed by record key.
   *
   * When `keys` is provided (and typed as `as const`), VS Code can autocomplete
   * transformer keys based on the mapped values.
   */
  readonly transformers?: KeyedTransformers<
    TKeys extends TableKeysMap ? KeyValues<TKeys> : never
  >;
}

export interface VerticalTableOptions<TKeys extends TableKeysMap | undefined = undefined> {
  readonly coerce?: boolean;
  /**
   * Optional mapping from raw vertical headers (first column values) to record keys.
   */
  readonly keys?: TKeys;
  readonly transformers?: KeyedTransformers<
    TKeys extends TableKeysMap ? KeyValues<TKeys> : never
  >;
}

export interface MatrixKeys<
  TRows extends TableKeysMap | undefined = undefined,
  TColumns extends TableKeysMap | undefined = undefined
> {
  readonly rows?: TRows;
  readonly columns?: TColumns;
}

type MatrixRowKeys<TKeys extends MatrixKeys | undefined> =
  TKeys extends MatrixKeys<
    infer TRows extends TableKeysMap | undefined,
    infer _TColumns extends TableKeysMap | undefined
  >
    ? TRows extends TableKeysMap
      ? KeyValues<TRows>
      : never
    : never;

type MatrixColumnKeys<TKeys extends MatrixKeys | undefined> =
  TKeys extends MatrixKeys<
    infer _TRows extends TableKeysMap | undefined,
    infer TColumns extends TableKeysMap | undefined
  >
    ? TColumns extends TableKeysMap
      ? KeyValues<TColumns>
      : never
    : never;

type KeyedNestedTransformers<K1 extends string, K2 extends string> =
  Readonly<Record<string, Readonly<Record<string, TableTransformer>>>> &
    Readonly<
      Partial<
        Record<
          K1,
          Readonly<Partial<Record<K2, TableTransformer>>>
        >
      >
    >;

export interface MatrixCellTransformers<TKeys extends MatrixKeys | undefined = undefined> {
  readonly rows?: KeyedTransformers<MatrixRowKeys<TKeys>>;
  readonly columns?: KeyedTransformers<MatrixColumnKeys<TKeys>>;
  readonly cells?: KeyedNestedTransformers<
    MatrixRowKeys<TKeys>,
    MatrixColumnKeys<TKeys>
  >;
}

export interface MatrixTableOptions<TKeys extends MatrixKeys | undefined = undefined> {
  readonly coerce?: boolean;
  /**
   * Optional mapping for row/column headers in a matrix table.
   */
  readonly keys?: TKeys;
  readonly transformers?: MatrixCellTransformers<TKeys>;
}

export type TableValue = TablePrimitive | unknown;

export const DEFAULT_COERCE_BY_SHAPE: Record<TableShape, boolean> = {
  headerless: false,
  horizontal: true,
  vertical: true,
  matrix: true,
};
