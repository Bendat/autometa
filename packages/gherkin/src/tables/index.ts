export { HeaderlessTable } from "./headerless-table";
export { HorizontalTable } from "./horizontal-table";
export { VerticalTable } from "./vertical-table";
export { MatrixTable } from "./matrix-table";
export { createTable, type TableInstance } from "./create-table";
export type {
  TableShape,
  TableValue,
  ResolveOptions,
  HeaderlessTableOptions,
  HorizontalTableOptions,
  VerticalTableOptions,
  MatrixTableOptions,
  MatrixCellTransformers,
  TableTransformer,
  MatrixKeys,
  TableKeysMap,
  TablePrimitive,
  TableRecord,
  TableRowContext,
  TableRowMapper,
  TableInstanceFactory,
  TableInstanceOptions,
} from "./types";
export { DEFAULT_COERCE_BY_SHAPE } from "./types";
export { defaultHeaderNormalizer } from "./record-mapper";
