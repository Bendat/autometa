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

export interface HeaderlessTableOptions {
  readonly coerce?: boolean;
  readonly transformers?: Readonly<Record<number, TableTransformer>>;
}

export interface HorizontalTableOptions {
  readonly coerce?: boolean;
  readonly transformers?: Readonly<Record<string, TableTransformer>>;
}

export interface VerticalTableOptions {
  readonly coerce?: boolean;
  readonly transformers?: Readonly<Record<string, TableTransformer>>;
}

export interface MatrixCellTransformers {
  readonly rows?: Readonly<Record<string, TableTransformer>>;
  readonly columns?: Readonly<Record<string, TableTransformer>>;
  readonly cells?: Readonly<Record<string, Readonly<Record<string, TableTransformer>>>>;
}

export interface MatrixTableOptions {
  readonly coerce?: boolean;
  readonly transformers?: MatrixCellTransformers;
}

export type TableValue = TablePrimitive | unknown;

export const DEFAULT_COERCE_BY_SHAPE: Record<TableShape, boolean> = {
  headerless: false,
  horizontal: true,
  vertical: true,
  matrix: true,
};
