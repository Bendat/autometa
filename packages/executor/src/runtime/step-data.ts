import {
  createTable,
  DEFAULT_COERCE_BY_SHAPE,
  type HeaderlessTable,
  type HeaderlessTableOptions,
  type HorizontalTable,
  type HorizontalTableOptions,
  type MatrixTable,
  type MatrixTableOptions,
  type TableShape,
  type VerticalTable,
  type VerticalTableOptions,
} from "@autometa/gherkin";

type RawTable = readonly (readonly string[])[];

const DATA_TABLE_SYMBOL: unique symbol = Symbol("autometa:runner:step:data-table");
const DOCSTRING_SYMBOL: unique symbol = Symbol("autometa:runner:step:docstring");

type TableCarrier = Record<never, never> & {
  [DATA_TABLE_SYMBOL]?: RawTable;
  [DOCSTRING_SYMBOL]?: string | undefined;
};

type TableConfig = Record<TableShape, boolean>;

const DEFAULT_CONFIG: TableConfig = { ...DEFAULT_COERCE_BY_SHAPE };
let activeConfig: TableConfig = { ...DEFAULT_CONFIG };

function isObjectLike(value: unknown): value is TableCarrier {
  return typeof value === "object" && value !== null;
}

function cloneTable(source: string[][] | readonly (readonly string[])[]): RawTable {
  return source.map((row) => [...row]) as readonly (readonly string[])[];
}

function withCarrier(world: unknown): TableCarrier | undefined {
  if (!isObjectLike(world)) {
    return undefined;
  }
  return world as TableCarrier;
}

export interface TableAccessConfig {
  readonly coercePrimitives?: Partial<Record<TableShape, boolean>>;
}

export function configureStepTables(config: TableAccessConfig): void {
  if (config.coercePrimitives) {
    activeConfig = {
      ...activeConfig,
      ...config.coercePrimitives,
    } as TableConfig;
  }
}

export function resetStepTableConfig(): void {
  activeConfig = { ...DEFAULT_CONFIG };
}

export function setStepTable(
  world: unknown,
  table: string[][] | readonly (readonly string[])[] | undefined
): void {
  const carrier = withCarrier(world);
  if (!carrier) {
    return;
  }
  if (!table) {
    Reflect.deleteProperty(carrier, DATA_TABLE_SYMBOL);
    return;
  }
  const cloned = cloneTable(table);
  if (Object.prototype.hasOwnProperty.call(carrier, DATA_TABLE_SYMBOL)) {
    carrier[DATA_TABLE_SYMBOL] = cloned;
  } else {
    Object.defineProperty(carrier, DATA_TABLE_SYMBOL, {
      value: cloned,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}

export function clearStepTable(world: unknown): void {
  const carrier = withCarrier(world);
  if (!carrier) {
    return;
  }
  Reflect.deleteProperty(carrier, DATA_TABLE_SYMBOL);
}

export function setStepDocstring(world: unknown, docstring?: string): void {
  const carrier = withCarrier(world);
  if (!carrier) {
    return;
  }
  if (docstring === undefined) {
    Reflect.deleteProperty(carrier, DOCSTRING_SYMBOL);
    return;
  }
  if (Object.prototype.hasOwnProperty.call(carrier, DOCSTRING_SYMBOL)) {
    carrier[DOCSTRING_SYMBOL] = docstring;
  } else {
    Object.defineProperty(carrier, DOCSTRING_SYMBOL, {
      value: docstring,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}

export function clearStepDocstring(world: unknown): void {
  const carrier = withCarrier(world);
  if (!carrier) {
    return;
  }
  Reflect.deleteProperty(carrier, DOCSTRING_SYMBOL);
}

export function getDocstring(world: unknown): string | undefined {
  const carrier = withCarrier(world);
  return carrier?.[DOCSTRING_SYMBOL];
}

export function getRawTable(world: unknown): RawTable | undefined {
  const carrier = withCarrier(world);
  return carrier?.[DATA_TABLE_SYMBOL];
}

function resolveCoerceOverride(
  shape: TableShape,
  coerceOverride: boolean | undefined
): boolean {
  if (typeof coerceOverride === "boolean") {
    return coerceOverride;
  }
  return activeConfig[shape];
}

export function getTable(
  world: unknown,
  shape: "headerless",
  options?: HeaderlessTableOptions
): HeaderlessTable | undefined;
export function getTable(
  world: unknown,
  shape: "horizontal",
  options?: HorizontalTableOptions
): HorizontalTable | undefined;
export function getTable(
  world: unknown,
  shape: "vertical",
  options?: VerticalTableOptions
): VerticalTable | undefined;
export function getTable(
  world: unknown,
  shape: "matrix",
  options?: MatrixTableOptions
): MatrixTable | undefined;
export function getTable(
  world: unknown,
  shape: TableShape,
  options?:
    | HeaderlessTableOptions
    | HorizontalTableOptions
    | VerticalTableOptions
    | MatrixTableOptions
): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined {
  const table = getRawTable(world);
  if (!table) {
    return undefined;
  }
  const coerce = resolveCoerceOverride(shape, options?.coerce);
  switch (shape) {
    case "headerless":
      return createTable(table, "headerless", {
        ...(options as HeaderlessTableOptions | undefined),
        coerce,
      });
    case "horizontal":
      return createTable(table, "horizontal", {
        ...(options as HorizontalTableOptions | undefined),
        coerce,
      });
    case "vertical":
      return createTable(table, "vertical", {
        ...(options as VerticalTableOptions | undefined),
        coerce,
      });
    case "matrix":
      return createTable(table, "matrix", {
        ...(options as MatrixTableOptions | undefined),
        coerce,
      });
    default:
      return undefined;
  }
}

export function consumeTable(
  world: unknown,
  shape: TableShape,
  options?:
    | HeaderlessTableOptions
    | HorizontalTableOptions
    | VerticalTableOptions
    | MatrixTableOptions
): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined {
  let instance:
    | HeaderlessTable
    | HorizontalTable
    | VerticalTable
    | MatrixTable
    | undefined;
  switch (shape) {
    case "headerless":
      instance = getTable(world, "headerless", options as HeaderlessTableOptions | undefined);
      break;
    case "horizontal":
      instance = getTable(world, "horizontal", options as HorizontalTableOptions | undefined);
      break;
    case "vertical":
      instance = getTable(world, "vertical", options as VerticalTableOptions | undefined);
      break;
    case "matrix":
      instance = getTable(world, "matrix", options as MatrixTableOptions | undefined);
      break;
    default:
      instance = undefined;
  }
  clearStepTable(world);
  return instance;
}

export function consumeDocstring(world: unknown): string | undefined {
  const value = getDocstring(world);
  clearStepDocstring(world);
  return value;
}
