import { HeaderlessTable } from "./headerless-table";
import { HorizontalTable } from "./horizontal-table";
import { MatrixTable } from "./matrix-table";
import { VerticalTable } from "./vertical-table";
import {
  DEFAULT_COERCE_BY_SHAPE,
  type HeaderlessTableOptions,
  type HorizontalTableOptions,
  type MatrixTableOptions,
  type TableShape,
  type VerticalTableOptions,
} from "./types";

export type TableInstance =
  | HeaderlessTable
  | HorizontalTable
  | VerticalTable
  | MatrixTable;

export interface CreateTableOverrides {
  readonly coerce?: boolean;
}

export function createTable(
  data: readonly (readonly string[])[],
  shape: "headerless",
  options?: HeaderlessTableOptions & CreateTableOverrides
): HeaderlessTable;
export function createTable(
  data: readonly (readonly string[])[],
  shape: "horizontal",
  options?: HorizontalTableOptions & CreateTableOverrides
): HorizontalTable;
export function createTable(
  data: readonly (readonly string[])[],
  shape: "vertical",
  options?: VerticalTableOptions & CreateTableOverrides
): VerticalTable;
export function createTable(
  data: readonly (readonly string[])[],
  shape: "matrix",
  options?: MatrixTableOptions & CreateTableOverrides
): MatrixTable;
export function createTable(
  data: readonly (readonly string[])[],
  shape: TableShape,
  options?: (
    | HeaderlessTableOptions
    | HorizontalTableOptions
    | VerticalTableOptions
    | MatrixTableOptions
  ) &
    CreateTableOverrides
): TableInstance {
  const baseCoerce = DEFAULT_COERCE_BY_SHAPE[shape];
  const coerce = options?.coerce ?? baseCoerce;
  switch (shape) {
    case "headerless":
      return new HeaderlessTable(data, {
        ...(options as HeaderlessTableOptions | undefined),
        coerce,
      });
    case "horizontal":
      return new HorizontalTable(data, {
        ...(options as HorizontalTableOptions | undefined),
        coerce,
      });
    case "vertical":
      return new VerticalTable(data, {
        ...(options as VerticalTableOptions | undefined),
        coerce,
      });
    case "matrix":
      return new MatrixTable(data, {
        ...(options as MatrixTableOptions | undefined),
        coerce,
      });
    default:
      throw new TypeError(`Unsupported table shape: ${shape satisfies never}`);
  }
}
