import {
  createTable,
  DEFAULT_COERCE_BY_SHAPE,
  type HeaderlessTable,
  type HeaderlessTableOptions,
  type HorizontalTable,
  type HorizontalTableOptions,
  type MatrixKeys,
  type MatrixTable,
  type MatrixTableOptions,
  type TableKeysMap,
  type TableShape,
  type VerticalTable,
  type VerticalTableOptions,
} from "@autometa/gherkin";
import type { SourceRef, StepExpression, StepKeyword } from "@autometa/scopes";

export type RawTable = readonly (readonly string[])[];

declare const DATA_TABLE_SYMBOL_KEY: unique symbol;
declare const DOCSTRING_SYMBOL_KEY: unique symbol;
declare const DOCSTRING_MEDIA_TYPE_SYMBOL_KEY: unique symbol;
declare const STEP_RUNTIME_SYMBOL_KEY: unique symbol;
declare const STEP_METADATA_SYMBOL_KEY: unique symbol;

const DATA_TABLE_SYMBOL: typeof DATA_TABLE_SYMBOL_KEY = Symbol.for(
  "autometa:runner:step:data-table"
) as typeof DATA_TABLE_SYMBOL_KEY;
const DOCSTRING_SYMBOL: typeof DOCSTRING_SYMBOL_KEY = Symbol.for(
  "autometa:runner:step:docstring"
) as typeof DOCSTRING_SYMBOL_KEY;
const DOCSTRING_MEDIA_TYPE_SYMBOL: typeof DOCSTRING_MEDIA_TYPE_SYMBOL_KEY = Symbol.for(
  "autometa:runner:step:docstring:media-type"
) as typeof DOCSTRING_MEDIA_TYPE_SYMBOL_KEY;
const STEP_RUNTIME_SYMBOL: typeof STEP_RUNTIME_SYMBOL_KEY = Symbol.for(
  "autometa:runner:step:runtime"
) as typeof STEP_RUNTIME_SYMBOL_KEY;
const STEP_METADATA_SYMBOL: typeof STEP_METADATA_SYMBOL_KEY = Symbol.for(
  "autometa:runner:step:metadata"
) as typeof STEP_METADATA_SYMBOL_KEY;

type TableCarrier = Record<never, never> & {
  [DATA_TABLE_SYMBOL]?: RawTable;
  [DOCSTRING_SYMBOL]?: string | undefined;
  [DOCSTRING_MEDIA_TYPE_SYMBOL]?: string | undefined;
  [STEP_RUNTIME_SYMBOL]?: StepRuntimeHelpers;
  [STEP_METADATA_SYMBOL]?: StepRuntimeMetadata;
  runtime?: StepRuntimeHelpers;
};

type TableConfig = Record<TableShape, boolean>;

type TableOptionsProvider<T> = T | (new () => T);

const DEFAULT_CONFIG: TableConfig = { ...DEFAULT_COERCE_BY_SHAPE };
let activeConfig: TableConfig = { ...DEFAULT_CONFIG };

export interface DocstringInfo {
  readonly content: string;
  readonly mediaType?: string;
}

export type DocstringTransformer<T = unknown> = (
  content: string,
  context: { readonly mediaType?: string }
) => T;

export interface DocstringTransformConfig {
  readonly transformers: Readonly<Record<string, DocstringTransformer>>;
}

const DEFAULT_DOCSTRING_CONFIG: DocstringTransformConfig = { transformers: {} };
let activeDocstringConfig: DocstringTransformConfig = { ...DEFAULT_DOCSTRING_CONFIG };

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
    Reflect.deleteProperty(carrier, DOCSTRING_MEDIA_TYPE_SYMBOL);
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
  Reflect.deleteProperty(carrier, DOCSTRING_MEDIA_TYPE_SYMBOL);
}

export function setStepDocstringInfo(world: unknown, docstring?: DocstringInfo): void {
  if (docstring === undefined) {
    setStepDocstring(world, undefined);
    return;
  }

  setStepDocstring(world, docstring.content);

  const carrier = withCarrier(world);
  if (!carrier) {
    return;
  }

  const mediaType = docstring.mediaType;
  if (mediaType === undefined) {
    Reflect.deleteProperty(carrier, DOCSTRING_MEDIA_TYPE_SYMBOL);
    return;
  }

  if (Object.prototype.hasOwnProperty.call(carrier, DOCSTRING_MEDIA_TYPE_SYMBOL)) {
    carrier[DOCSTRING_MEDIA_TYPE_SYMBOL] = mediaType;
  } else {
    Object.defineProperty(carrier, DOCSTRING_MEDIA_TYPE_SYMBOL, {
      value: mediaType,
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
  Reflect.deleteProperty(carrier, DOCSTRING_MEDIA_TYPE_SYMBOL);
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

export function getDocstringMediaType(world: unknown): string | undefined {
  const carrier = withCarrier(world);
  return carrier?.[DOCSTRING_MEDIA_TYPE_SYMBOL];
}

export function getDocstringInfo(world: unknown): DocstringInfo | undefined {
  const content = getDocstring(world);
  if (content === undefined) {
    return undefined;
  }
  const mediaType = getDocstringMediaType(world);
  if (mediaType === undefined) {
    return { content };
  }
  return { content, mediaType };
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

function resolveTableOptions<T>(
  optionsOrProvider: TableOptionsProvider<T> | undefined
): T | undefined {
  if (!optionsOrProvider) {
    return undefined;
  }
  if (typeof optionsOrProvider === "function") {
    return new (optionsOrProvider as new () => T)();
  }
  return optionsOrProvider;
}

export function getTable(
  world: unknown,
  shape: "headerless",
  options?: TableOptionsProvider<HeaderlessTableOptions>
): HeaderlessTable | undefined;
export function getTable(
  world: unknown,
  shape: "horizontal",
  options?: TableOptionsProvider<HorizontalTableOptions>
): HorizontalTable | undefined;
export function getTable(
  world: unknown,
  shape: "vertical",
  options?: TableOptionsProvider<VerticalTableOptions>
): VerticalTable | undefined;
export function getTable(
  world: unknown,
  shape: "matrix",
  options?: TableOptionsProvider<MatrixTableOptions>
): MatrixTable | undefined;
export function getTable<TKeys extends TableKeysMap>(
  world: unknown,
  shape: "horizontal",
  options?: TableOptionsProvider<HorizontalTableOptions<TKeys>>
): HorizontalTable | undefined;
export function getTable<TKeys extends TableKeysMap>(
  world: unknown,
  shape: "vertical",
  options?: TableOptionsProvider<VerticalTableOptions<TKeys>>
): VerticalTable | undefined;
export function getTable<TKeys extends MatrixKeys>(
  world: unknown,
  shape: "matrix",
  options?: TableOptionsProvider<MatrixTableOptions<TKeys>>
): MatrixTable | undefined;
export function getTable(
  world: unknown,
  shape: TableShape,
  options?:
    | TableOptionsProvider<HeaderlessTableOptions>
    | TableOptionsProvider<HorizontalTableOptions>
    | TableOptionsProvider<VerticalTableOptions>
    | TableOptionsProvider<MatrixTableOptions>
): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined {
  const table = getRawTable(world);
  if (!table) {
    return undefined;
  }
  const resolvedOptions = resolveTableOptions(options);
  const coerce = resolveCoerceOverride(shape, resolvedOptions?.coerce);
  switch (shape) {
    case "headerless":
      return createTable(table, "headerless", {
        ...(resolvedOptions as HeaderlessTableOptions | undefined),
        coerce,
      });
    case "horizontal":
      return createTable(table, "horizontal", {
        ...(resolvedOptions as HorizontalTableOptions | undefined),
        coerce,
      });
    case "vertical":
      return createTable(table, "vertical", {
        ...(resolvedOptions as VerticalTableOptions | undefined),
        coerce,
      });
    case "matrix":
      return createTable(table, "matrix", {
        ...(resolvedOptions as MatrixTableOptions | undefined),
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
    | TableOptionsProvider<HeaderlessTableOptions>
    | TableOptionsProvider<HorizontalTableOptions>
    | TableOptionsProvider<VerticalTableOptions>
    | TableOptionsProvider<MatrixTableOptions>
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

function normalizeDocstringMediaType(mediaType: string | undefined): string | undefined {
  if (!mediaType) {
    return undefined;
  }
  const normalized = mediaType.trim();
  if (!normalized) {
    return undefined;
  }
  const [primary] = normalized.split(";", 1);
  return primary?.trim().toLowerCase() || undefined;
}

function resolveDocstringTransformer(
  transformers: Readonly<Record<string, DocstringTransformer>>,
  mediaType: string | undefined
): DocstringTransformer | undefined {
  const normalized = normalizeDocstringMediaType(mediaType);
  if (!normalized) {
    return undefined;
  }

  if (transformers[normalized]) {
    return transformers[normalized];
  }

  const slashIndex = normalized.indexOf("/");
  if (slashIndex !== -1) {
    const subtype = normalized.slice(slashIndex + 1);
    if (transformers[subtype]) {
      return transformers[subtype];
    }
    const plusIndex = subtype.lastIndexOf("+");
    if (plusIndex !== -1) {
      const suffix = subtype.slice(plusIndex + 1);
      if (transformers[`+${suffix}`]) {
        return transformers[`+${suffix}`];
      }
      if (transformers[suffix]) {
        return transformers[suffix];
      }
    }
  }

  return undefined;
}

export function configureStepDocstrings(
  config: Partial<DocstringTransformConfig>
): void {
  if (config.transformers) {
    activeDocstringConfig = {
      ...activeDocstringConfig,
      transformers: {
        ...activeDocstringConfig.transformers,
        ...config.transformers,
      },
    };
  }
}

export function resetStepDocstringConfig(): void {
  activeDocstringConfig = { ...DEFAULT_DOCSTRING_CONFIG };
}

export interface StepRuntimeHelpers {
  readonly hasTable: boolean;
  readonly hasDocstring: boolean;
  readonly currentStep: StepRuntimeMetadata | undefined;
  getTable(
    shape: "headerless",
    options?: TableOptionsProvider<HeaderlessTableOptions>
  ): HeaderlessTable | undefined;
  getTable(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions>
  ): HorizontalTable | undefined;
  getTable<TKeys extends TableKeysMap>(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions<TKeys>>
  ): HorizontalTable | undefined;
  getTable(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions>
  ): VerticalTable | undefined;
  getTable<TKeys extends TableKeysMap>(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions<TKeys>>
  ): VerticalTable | undefined;
  getTable(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions>
  ): MatrixTable | undefined;
  getTable<TKeys extends MatrixKeys>(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions<TKeys>>
  ): MatrixTable | undefined;
  getTable(
    shape: TableShape,
    options?:
      | TableOptionsProvider<HeaderlessTableOptions>
      | TableOptionsProvider<HorizontalTableOptions>
      | TableOptionsProvider<VerticalTableOptions>
      | TableOptionsProvider<MatrixTableOptions>
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined;
  consumeTable(
    shape: "headerless",
    options?: TableOptionsProvider<HeaderlessTableOptions>
  ): HeaderlessTable | undefined;
  consumeTable(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions>
  ): HorizontalTable | undefined;
  consumeTable<TKeys extends TableKeysMap>(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions<TKeys>>
  ): HorizontalTable | undefined;
  consumeTable(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions>
  ): VerticalTable | undefined;
  consumeTable<TKeys extends TableKeysMap>(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions<TKeys>>
  ): VerticalTable | undefined;
  consumeTable(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions>
  ): MatrixTable | undefined;
  consumeTable<TKeys extends MatrixKeys>(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions<TKeys>>
  ): MatrixTable | undefined;
  consumeTable(
    shape: TableShape,
    options?:
      | TableOptionsProvider<HeaderlessTableOptions>
      | TableOptionsProvider<HorizontalTableOptions>
      | TableOptionsProvider<VerticalTableOptions>
      | TableOptionsProvider<MatrixTableOptions>
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable | undefined;
  requireTable(
    shape: "headerless",
    options?: TableOptionsProvider<HeaderlessTableOptions>
  ): HeaderlessTable;
  requireTable(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions>
  ): HorizontalTable;
  requireTable<TKeys extends TableKeysMap>(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions<TKeys>>
  ): HorizontalTable;
  requireTable(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions>
  ): VerticalTable;
  requireTable<TKeys extends TableKeysMap>(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions<TKeys>>
  ): VerticalTable;
  requireTable(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions>
  ): MatrixTable;
  requireTable<TKeys extends MatrixKeys>(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions<TKeys>>
  ): MatrixTable;
  requireTable(
    shape: TableShape,
    options?:
      | TableOptionsProvider<HeaderlessTableOptions>
      | TableOptionsProvider<HorizontalTableOptions>
      | TableOptionsProvider<VerticalTableOptions>
      | TableOptionsProvider<MatrixTableOptions>
  ): HeaderlessTable | HorizontalTable | VerticalTable | MatrixTable;
  getRawTable(): RawTable | undefined;
  getDocstring(): string | undefined;
  getDocstringMediaType(): string | undefined;
  getDocstringInfo(): DocstringInfo | undefined;
  consumeDocstring(): string | undefined;
  getDocstringTransformed(options?: { readonly fallback?: "raw" | "throw" }): unknown | undefined;
  consumeDocstringTransformed(options?: { readonly fallback?: "raw" | "throw" }): unknown | undefined;
  getStepMetadata(): StepRuntimeMetadata | undefined;
}

function bindGetTable(world: unknown) {
  function getTable(
    shape: "headerless",
    options?: TableOptionsProvider<HeaderlessTableOptions>
  ): HeaderlessTable | undefined;
  function getTable(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions>
  ): HorizontalTable | undefined;
  function getTable<TKeys extends TableKeysMap>(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions<TKeys>>
  ): HorizontalTable | undefined;
  function getTable(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions>
  ): VerticalTable | undefined;
  function getTable<TKeys extends TableKeysMap>(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions<TKeys>>
  ): VerticalTable | undefined;
  function getTable(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions>
  ): MatrixTable | undefined;
  function getTable<TKeys extends MatrixKeys>(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions<TKeys>>
  ): MatrixTable | undefined;
  function getTable(
    shape: TableShape,
    options?:
      | TableOptionsProvider<HeaderlessTableOptions>
      | TableOptionsProvider<HorizontalTableOptions>
      | TableOptionsProvider<VerticalTableOptions>
      | TableOptionsProvider<MatrixTableOptions>
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
    options?: TableOptionsProvider<HeaderlessTableOptions>
  ): HeaderlessTable | undefined;
  function consume(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions>
  ): HorizontalTable | undefined;
  function consume<TKeys extends TableKeysMap>(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions<TKeys>>
  ): HorizontalTable | undefined;
  function consume(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions>
  ): VerticalTable | undefined;
  function consume<TKeys extends TableKeysMap>(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions<TKeys>>
  ): VerticalTable | undefined;
  function consume(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions>
  ): MatrixTable | undefined;
  function consume<TKeys extends MatrixKeys>(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions<TKeys>>
  ): MatrixTable | undefined;
  function consume(
    shape: TableShape,
    options?:
      | TableOptionsProvider<HeaderlessTableOptions>
      | TableOptionsProvider<HorizontalTableOptions>
      | TableOptionsProvider<VerticalTableOptions>
      | TableOptionsProvider<MatrixTableOptions>
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
    options?: TableOptionsProvider<HeaderlessTableOptions>
  ): HeaderlessTable;
  function require(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions>
  ): HorizontalTable;
  function require<TKeys extends TableKeysMap>(
    shape: "horizontal",
    options?: TableOptionsProvider<HorizontalTableOptions<TKeys>>
  ): HorizontalTable;
  function require(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions>
  ): VerticalTable;
  function require<TKeys extends TableKeysMap>(
    shape: "vertical",
    options?: TableOptionsProvider<VerticalTableOptions<TKeys>>
  ): VerticalTable;
  function require(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions>
  ): MatrixTable;
  function require<TKeys extends MatrixKeys>(
    shape: "matrix",
    options?: TableOptionsProvider<MatrixTableOptions<TKeys>>
  ): MatrixTable;
  function require(
    shape: TableShape,
    options?:
      | TableOptionsProvider<HeaderlessTableOptions>
      | TableOptionsProvider<HorizontalTableOptions>
      | TableOptionsProvider<VerticalTableOptions>
      | TableOptionsProvider<MatrixTableOptions>
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

  const getDocstringTransformed = (
    options?: { readonly fallback?: "raw" | "throw" }
  ): unknown | undefined => {
    const info = getDocstringInfo(world);
    if (!info) {
      return undefined;
    }
    const transformer = resolveDocstringTransformer(
      activeDocstringConfig.transformers,
      info.mediaType
    );
    if (!transformer) {
      if (options?.fallback === "throw") {
        const type = normalizeDocstringMediaType(info.mediaType) ?? "<unknown>";
        throw new RangeError(
          `No docstring transformer is configured for media type '${type}'.`
        );
      }
      return info.content;
    }
    return transformer(
      info.content,
      info.mediaType === undefined ? {} : { mediaType: info.mediaType }
    );
  };

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
    getDocstringMediaType() {
      return getDocstringMediaType(world);
    },
    getDocstringInfo() {
      return getDocstringInfo(world);
    },
    consumeDocstring() {
      return consumeDocstring(world);
    },
    getDocstringTransformed,
    consumeDocstringTransformed(options) {
      const result = getDocstringTransformed(options);
      clearStepDocstring(world);
      return result;
    },
    getStepMetadata() {
      return getStepMetadata(world);
    },
    requireTable: bindRequireTable(world),
  };
  cacheRuntime(world, runtime);
  return runtime;
}
