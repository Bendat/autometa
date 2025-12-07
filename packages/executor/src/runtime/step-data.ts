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
import type { SourceRef, StepExpression, StepKeyword } from "@autometa/scopes";

export type RawTable = readonly (readonly string[])[];

declare const DATA_TABLE_SYMBOL_KEY: unique symbol;
declare const DOCSTRING_SYMBOL_KEY: unique symbol;
declare const STEP_RUNTIME_SYMBOL_KEY: unique symbol;
declare const STEP_METADATA_SYMBOL_KEY: unique symbol;

const DATA_TABLE_SYMBOL: typeof DATA_TABLE_SYMBOL_KEY = Symbol.for(
  "autometa:runner:step:data-table"
) as typeof DATA_TABLE_SYMBOL_KEY;
const DOCSTRING_SYMBOL: typeof DOCSTRING_SYMBOL_KEY = Symbol.for(
  "autometa:runner:step:docstring"
) as typeof DOCSTRING_SYMBOL_KEY;
const STEP_RUNTIME_SYMBOL: typeof STEP_RUNTIME_SYMBOL_KEY = Symbol.for(
  "autometa:runner:step:runtime"
) as typeof STEP_RUNTIME_SYMBOL_KEY;
const STEP_METADATA_SYMBOL: typeof STEP_METADATA_SYMBOL_KEY = Symbol.for(
  "autometa:runner:step:metadata"
) as typeof STEP_METADATA_SYMBOL_KEY;

type TableCarrier = Record<never, never> & {
  [DATA_TABLE_SYMBOL]?: RawTable;
  [DOCSTRING_SYMBOL]?: string | undefined;
  [STEP_RUNTIME_SYMBOL]?: StepRuntimeHelpers;
  [STEP_METADATA_SYMBOL]?: StepRuntimeMetadata;
  runtime?: StepRuntimeHelpers;
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

export interface StepRuntimeStepMetadata {
  readonly keyword?: string;
  readonly text?: string;
  readonly source?: SourceRef;
}

export interface StepRuntimeFeatureMetadata {
  readonly name: string;
  readonly keyword: string;
  readonly uri?: string;
  readonly source?: SourceRef;
}

export interface StepRuntimeScenarioMetadata {
  readonly name: string;
  readonly keyword: string;
  readonly source?: SourceRef;
}

export interface StepRuntimeOutlineMetadata {
  readonly name: string;
  readonly keyword: string;
  readonly source?: SourceRef;
}

export interface StepRuntimeExampleMetadata {
  readonly name?: string;
  readonly index: number;
  readonly values: Readonly<Record<string, string>>;
  readonly source?: SourceRef;
}

export interface StepRuntimeDefinitionMetadata {
  readonly keyword: StepKeyword;
  readonly expression: StepExpression;
  readonly source?: SourceRef;
}

export interface StepRuntimeMetadata {
  readonly feature?: StepRuntimeFeatureMetadata;
  readonly scenario?: StepRuntimeScenarioMetadata;
  readonly outline?: StepRuntimeOutlineMetadata;
  readonly example?: StepRuntimeExampleMetadata;
  readonly step?: StepRuntimeStepMetadata;
  readonly definition?: StepRuntimeDefinitionMetadata;
}

export function setStepMetadata(world: unknown, metadata?: StepRuntimeMetadata): void {
  const carrier = withCarrier(world);
  if (!carrier) {
    return;
  }
  if (!metadata) {
    Reflect.deleteProperty(carrier, STEP_METADATA_SYMBOL);
    return;
  }
  if (Object.prototype.hasOwnProperty.call(carrier, STEP_METADATA_SYMBOL)) {
    carrier[STEP_METADATA_SYMBOL] = metadata;
  } else {
    Object.defineProperty(carrier, STEP_METADATA_SYMBOL, {
      value: metadata,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}

export function clearStepMetadata(world: unknown): void {
  const carrier = withCarrier(world);
  if (!carrier) {
    return;
  }
  Reflect.deleteProperty(carrier, STEP_METADATA_SYMBOL);
}

export function getStepMetadata(world: unknown): StepRuntimeMetadata | undefined {
  const carrier = withCarrier(world);
  return carrier?.[STEP_METADATA_SYMBOL];
}

export function getDocstring(world: unknown): string | undefined {
  const carrier = withCarrier(world);
  return carrier?.[DOCSTRING_SYMBOL];
}

export function getRawTable(world: unknown): RawTable | undefined {
  const carrier = withCarrier(world);
  return carrier?.[DATA_TABLE_SYMBOL];
}

export function getStepRuntimeFromWorld(world: unknown): StepRuntimeHelpers | undefined {
  const carrier = withCarrier(world);
  return carrier?.[STEP_RUNTIME_SYMBOL];
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

export interface StepRuntimeHelpers {
  readonly hasTable: boolean;
  readonly hasDocstring: boolean;
  readonly currentStep: StepRuntimeMetadata | undefined;
  getTable(
    shape: "headerless",
    options?: HeaderlessTableOptions
  ): HeaderlessTable | undefined;
  getTable(
    shape: "horizontal",
    options?: HorizontalTableOptions
  ): HorizontalTable | undefined;
  getTable(
    shape: "vertical",
    options?: VerticalTableOptions
  ): VerticalTable | undefined;
  getTable(
    shape: "matrix",
    options?: MatrixTableOptions
  ): MatrixTable | undefined;
  getTable(
    shape: TableShape,
    options?:
      | HeaderlessTableOptions
      | HorizontalTableOptions
      | VerticalTableOptions
      | MatrixTableOptions
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined;
  consumeTable(
    shape: "headerless",
    options?: HeaderlessTableOptions
  ): HeaderlessTable | undefined;
  consumeTable(
    shape: "horizontal",
    options?: HorizontalTableOptions
  ): HorizontalTable | undefined;
  consumeTable(
    shape: "vertical",
    options?: VerticalTableOptions
  ): VerticalTable | undefined;
  consumeTable(
    shape: "matrix",
    options?: MatrixTableOptions
  ): MatrixTable | undefined;
  consumeTable(
    shape: TableShape,
    options?:
      | HeaderlessTableOptions
      | HorizontalTableOptions
      | VerticalTableOptions
      | MatrixTableOptions
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined;
  requireTable(
    shape: "headerless",
    options?: HeaderlessTableOptions
  ): HeaderlessTable;
  requireTable(
    shape: "horizontal",
    options?: HorizontalTableOptions
  ): HorizontalTable;
  requireTable(
    shape: "vertical",
    options?: VerticalTableOptions
  ): VerticalTable;
  requireTable(
    shape: "matrix",
    options?: MatrixTableOptions
  ): MatrixTable;
  requireTable(
    shape: TableShape,
    options?:
      | HeaderlessTableOptions
      | HorizontalTableOptions
      | VerticalTableOptions
      | MatrixTableOptions
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable;
  getRawTable(): RawTable | undefined;
  getDocstring(): string | undefined;
  consumeDocstring(): string | undefined;
  getStepMetadata(): StepRuntimeMetadata | undefined;
}

function bindGetTable(world: unknown) {
  function getTable(
    shape: "headerless",
    options?: HeaderlessTableOptions
  ): HeaderlessTable | undefined;
  function getTable(
    shape: "horizontal",
    options?: HorizontalTableOptions
  ): HorizontalTable | undefined;
  function getTable(
    shape: "vertical",
    options?: VerticalTableOptions
  ): VerticalTable | undefined;
  function getTable(
    shape: "matrix",
    options?: MatrixTableOptions
  ): MatrixTable | undefined;
  function getTable(
    shape: TableShape,
    options?:
      | HeaderlessTableOptions
      | HorizontalTableOptions
      | VerticalTableOptions
      | MatrixTableOptions
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined {
    switch (shape) {
      case "headerless":
        return getTableForShape(world, "headerless", options as HeaderlessTableOptions | undefined);
      case "horizontal":
        return getTableForShape(world, "horizontal", options as HorizontalTableOptions | undefined);
      case "vertical":
        return getTableForShape(world, "vertical", options as VerticalTableOptions | undefined);
      case "matrix":
        return getTableForShape(world, "matrix", options as MatrixTableOptions | undefined);
      default:
        return undefined;
    }
  }
  return getTable;
}

function getTableForShape(
  world: unknown,
  shape: "headerless",
  options?: HeaderlessTableOptions
): HeaderlessTable | undefined;
function getTableForShape(
  world: unknown,
  shape: "horizontal",
  options?: HorizontalTableOptions
): HorizontalTable | undefined;
function getTableForShape(
  world: unknown,
  shape: "vertical",
  options?: VerticalTableOptions
): VerticalTable | undefined;
function getTableForShape(
  world: unknown,
  shape: "matrix",
  options?: MatrixTableOptions
): MatrixTable | undefined;
function getTableForShape(
  world: unknown,
  shape: TableShape,
  options?:
    | HeaderlessTableOptions
    | HorizontalTableOptions
    | VerticalTableOptions
    | MatrixTableOptions
): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined {
  switch (shape) {
    case "headerless":
      return getTable(world, "headerless", options as HeaderlessTableOptions | undefined);
    case "horizontal":
      return getTable(world, "horizontal", options as HorizontalTableOptions | undefined);
    case "vertical":
      return getTable(world, "vertical", options as VerticalTableOptions | undefined);
    case "matrix":
      return getTable(world, "matrix", options as MatrixTableOptions | undefined);
    default:
      return undefined;
  }
}

function bindConsumeTable(world: unknown) {
  function consume(
    shape: "headerless",
    options?: HeaderlessTableOptions
  ): HeaderlessTable | undefined;
  function consume(
    shape: "horizontal",
    options?: HorizontalTableOptions
  ): HorizontalTable | undefined;
  function consume(
    shape: "vertical",
    options?: VerticalTableOptions
  ): VerticalTable | undefined;
  function consume(
    shape: "matrix",
    options?: MatrixTableOptions
  ): MatrixTable | undefined;
  function consume(
    shape: TableShape,
    options?:
      | HeaderlessTableOptions
      | HorizontalTableOptions
      | VerticalTableOptions
      | MatrixTableOptions
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined {
    switch (shape) {
      case "headerless":
        return consumeTable(world, "headerless", options as HeaderlessTableOptions | undefined);
      case "horizontal":
        return consumeTable(world, "horizontal", options as HorizontalTableOptions | undefined);
      case "vertical":
        return consumeTable(world, "vertical", options as VerticalTableOptions | undefined);
      case "matrix":
        return consumeTable(world, "matrix", options as MatrixTableOptions | undefined);
      default:
        return undefined;
    }
  }
  return consume;
}

function bindRequireTable(world: unknown) {
  function require(
    shape: "headerless",
    options?: HeaderlessTableOptions
  ): HeaderlessTable;
  function require(
    shape: "horizontal",
    options?: HorizontalTableOptions
  ): HorizontalTable;
  function require(
    shape: "vertical",
    options?: VerticalTableOptions
  ): VerticalTable;
  function require(
    shape: "matrix",
    options?: MatrixTableOptions
  ): MatrixTable;
  function require(
    shape: TableShape,
    options?:
      | HeaderlessTableOptions
      | HorizontalTableOptions
      | VerticalTableOptions
      | MatrixTableOptions
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable {
    switch (shape) {
      case "headerless": {
        const table = consumeTable(
          world,
          "headerless",
          options as HeaderlessTableOptions | undefined
        );
        if (!table) {
          throw new RangeError("No headerless data table is attached to the current step.");
        }
        return table;
      }
      case "horizontal": {
        const table = consumeTable(
          world,
          "horizontal",
          options as HorizontalTableOptions | undefined
        );
        if (!table) {
          throw new RangeError("No horizontal data table is attached to the current step.");
        }
        return table;
      }
      case "vertical": {
        const table = consumeTable(
          world,
          "vertical",
          options as VerticalTableOptions | undefined
        );
        if (!table) {
          throw new RangeError("No vertical data table is attached to the current step.");
        }
        return table;
      }
      case "matrix": {
        const table = consumeTable(
          world,
          "matrix",
          options as MatrixTableOptions | undefined
        );
        if (!table) {
          throw new RangeError("No matrix data table is attached to the current step.");
        }
        return table;
      }
      default:
        throw new RangeError(`Unsupported table shape: ${String(shape)}`);
    }
  }
  return require;
}

function cacheRuntime(world: unknown, runtime: StepRuntimeHelpers): void {
  const carrier = withCarrier(world);
  if (!carrier) {
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(carrier, STEP_RUNTIME_SYMBOL)) {
    Object.defineProperty(carrier, STEP_RUNTIME_SYMBOL, {
      value: runtime,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  } else {
    carrier[STEP_RUNTIME_SYMBOL] = runtime;
  }

  if (!Object.prototype.hasOwnProperty.call(carrier, "runtime")) {
    Object.defineProperty(carrier, "runtime", {
      get() {
        return carrier[STEP_RUNTIME_SYMBOL];
      },
      enumerable: false,
      configurable: true,
    });
  }
}

export function createStepRuntime(world: unknown): StepRuntimeHelpers {
  const existing = getStepRuntimeFromWorld(world);
  if (existing) {
    return existing;
  }

  const runtime: StepRuntimeHelpers = {
    get hasTable() {
      return getRawTable(world) !== undefined;
    },
    get hasDocstring() {
      return getDocstring(world) !== undefined;
    },
    get currentStep() {
      return getStepMetadata(world);
    },
    getTable: bindGetTable(world),
    consumeTable: bindConsumeTable(world),
    getRawTable() {
      return getRawTable(world);
    },
    getDocstring() {
      return getDocstring(world);
    },
    consumeDocstring() {
      return consumeDocstring(world);
    },
    getStepMetadata() {
      return getStepMetadata(world);
    },
    requireTable: bindRequireTable(world),
  };
  cacheRuntime(world, runtime);
  return runtime;
}
