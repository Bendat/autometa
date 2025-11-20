import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  CucumberExpressionTypeMap,
  ExecutableScopeFn,
  ExecutionMode,
  FeatureInput,
  HookDefinition,
  HookHandler,
  HookOptions,
  HookType,
  PendingState,
  ScopeKind,
  ScopeMetadata,
  ScopeNode,
  ScopeRegistrationOptions,
  ScenarioOutlineExamples,
  SourceRef,
  StepArgumentsForExpression,
  StepDsl,
  StepExpression,
  StepHandler,
  StepKeyword,
  StepOptions,
  StepTagInput,
  WithDefaultCucumberExpressionTypes,
} from "./types";
import { ScopeComposer } from "./scope-composer";

const FEATURE_DEFAULT_NAME = "feature";
const SCENARIO_DEFAULT_NAME = "scenario";
const RULE_DEFAULT_NAME = "rule";
const SCENARIO_OUTLINE_DEFAULT_NAME = "scenario outline";
const FEATURE_ALLOWED_PARENTS = ["root"] as const satisfies readonly ScopeKind[];
const RULE_ALLOWED_PARENTS = ["feature"] as const satisfies readonly ScopeKind[];
const SCENARIO_ALLOWED_PARENTS = ["feature", "rule"] as const satisfies readonly ScopeKind[];

type ScopeKindKey = "feature" | "scenario" | "rule" | "scenarioOutline";

interface NormalizedScopeCall {
  readonly name: string;
  readonly metadata: ScopeMetadata;
  readonly action?: () => void;
}

function clonePendingState(pending: PendingState): PendingState {
  if (typeof pending === "boolean" || typeof pending === "string") {
    return pending;
  }
  const reason = pending.reason;
  if (reason === undefined) {
    return {};
  }
  return { reason };
}

function createMetadata(partial?: ScopeMetadata): ScopeMetadata {
  if (!partial) {
    return {};
  }
  const { tags, description, timeout, mode, source, data, examples, pending } = partial;
  return {
    ...(tags && tags.length > 0 ? { tags: [...tags] } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(timeout !== undefined
      ? {
          timeout: typeof timeout === "number" ? timeout : { ...timeout },
        }
      : {}),
    ...(mode !== undefined ? { mode } : {}),
    ...(source ? { source: { ...source } } : {}),
    ...(data ? { data: { ...data } } : {}),
    ...(examples ? { examples: cloneExamples(examples) } : {}),
    ...(pending !== undefined ? { pending: clonePendingState(pending) } : {}),
  };
}

function cloneExamples(examples: readonly ScenarioOutlineExamples[]): ScenarioOutlineExamples[] {
  return examples.map((example) => ({
    ...example,
    ...(example.tags ? { tags: [...example.tags] } : {}),
    table: example.table.map((row) => [...row] as const),
  }));
}

function mergeScopeMetadata(
  base: ScopeMetadata | undefined,
  extras: ScopeMetadata | undefined
): ScopeMetadata {
  if (!base && !extras) {
    return {};
  }

  const combinedTags = [...(base?.tags ?? []), ...(extras?.tags ?? [])];
  const description = extras?.description ?? base?.description;
  const timeout = extras?.timeout ?? base?.timeout;
  const mode = base?.mode ?? extras?.mode;
  const source = extras?.source ?? base?.source;
  const data = {
    ...(base?.data ?? {}),
    ...(extras?.data ?? {}),
  };

  const examples = extras?.examples ?? base?.examples;
  const pending = extras?.pending ?? base?.pending;

  return createMetadata({
    ...(combinedTags.length > 0 ? { tags: combinedTags } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(timeout !== undefined ? { timeout } : {}),
    ...(mode !== undefined ? { mode } : {}),
    ...(source ? { source } : {}),
    ...(Object.keys(data).length > 0 ? { data } : {}),
    ...(examples ? { examples } : {}),
    ...(pending !== undefined ? { pending } : {}),
  });
}

function applyExecutionModeToStepOptions(
  mode: ExecutionMode,
  options?: StepOptions
): StepOptions | undefined {
  if (!options) {
    return mode === "default" ? undefined : { mode };
  }
  return mode !== "default" ? { ...options, mode } : { ...options };
}

type StepFamily<
  World,
  Types extends CucumberExpressionTypeMap
> = {
  readonly default: StepDsl<World, Types>;
  readonly skip: StepDsl<World, Types>;
  readonly only: StepDsl<World, Types>;
  readonly failing: StepDsl<World, Types>;
  readonly concurrent: StepDsl<World, Types>;
};

function normalizeTagInputs(inputs: readonly StepTagInput[]): readonly string[] {
  if (inputs.length === 0) {
    return [];
  }

  const tags: string[] = [];

  for (const input of inputs) {
    if (typeof input === "string") {
      if (input.length > 0) {
        tags.push(input);
      }
      continue;
    }

    if (Array.isArray(input)) {
      for (const tag of input) {
        if (typeof tag === "string" && tag.length > 0) {
          tags.push(tag);
        }
      }
    }
  }

  if (tags.length === 0) {
    return [];
  }

  return Array.from(new Set(tags));
}

function mergeStepOptions(
  base: StepOptions | undefined,
  extras: StepOptions | undefined
): StepOptions | undefined {
  if (!base && !extras) {
    return undefined;
  }

  const mergedTags = [
    ...(base?.tags ?? []),
    ...(extras?.tags ?? []),
  ];

  const timeout = extras?.timeout ?? base?.timeout;
  const mode = extras?.mode ?? base?.mode;
  const data = {
    ...(base?.data ?? {}),
    ...(extras?.data ?? {}),
  } satisfies Record<string, unknown>;

  const tagsResult =
    mergedTags.length > 0
      ? (Array.from(new Set(mergedTags)) as readonly string[])
      : undefined;

  const hasData = Object.keys(data).length > 0;

  if (!tagsResult && timeout === undefined && mode === undefined && !hasData) {
    return undefined;
  }

  const result: StepOptions = {
    ...(tagsResult ? { tags: tagsResult } : {}),
    ...(timeout !== undefined ? { timeout } : {}),
    ...(mode !== undefined ? { mode } : {}),
    ...(hasData ? { data } : {}),
  };

  return result;
}

function captureCallSite(): SourceRef | undefined {
  const prepare = Error.prepareStackTrace;
  try {
    Error.prepareStackTrace = (_error, stack) => stack;
    const capture = Error.captureStackTrace;
    if (typeof capture !== "function") {
      return undefined;
    }
    const error = new Error();
    capture(error, captureCallSite);
    const frames = error.stack as unknown as readonly NodeJS.CallSite[] | undefined;
    if (!frames) {
      return undefined;
    }

    const selected = selectRelevantFrame(frames);
    if (!selected) {
      return undefined;
    }

    const file = normalizeStackPath(selected.file);
    if (!file) {
      return undefined;
    }

    return {
      file,
      ...(selected.line !== undefined ? { line: selected.line } : {}),
      ...(selected.column !== undefined ? { column: selected.column } : {}),
    } satisfies SourceRef;
  } catch {
    return undefined;
  } finally {
    Error.prepareStackTrace = prepare;
  }
}

interface StackFrameInfo {
  readonly file: string;
  readonly line?: number;
  readonly column?: number;
}

function selectRelevantFrame(frames: readonly NodeJS.CallSite[]): StackFrameInfo | undefined {
  const fallback: StackFrameInfo[] = [];

  for (const frame of frames) {
    const fileName = frame.getFileName?.();
    if (!fileName) {
      continue;
    }

    const normalized = normalizeStackPath(fileName);
    if (!normalized) {
      continue;
    }

    const comparable = normalized.replace(/\\/g, "/");
    if (isInternalFrame(comparable)) {
      continue;
    }

    const line = frame.getLineNumber?.() ?? undefined;
    const column = frame.getColumnNumber?.() ?? undefined;
    const info: StackFrameInfo = {
      file: normalized,
      ...(line !== undefined ? { line } : {}),
      ...(column !== undefined ? { column } : {}),
    };

    if (isFrameworkFrame(comparable)) {
      fallback.push(info);
      continue;
    }

    return info;
  }

  return fallback[0];
}

function normalizeStackPath(candidate: string): string {
  if (candidate.startsWith("node:")) {
    return candidate;
  }
  if (candidate.startsWith("file://")) {
    try {
      return fileURLToPath(candidate);
    } catch {
      return candidate;
    }
  }
  if (!path.isAbsolute(candidate)) {
    return path.resolve(candidate);
  }
  return candidate;
}

function isInternalFrame(candidate: string): boolean {
  if (candidate.startsWith("node:")) {
    return true;
  }
  if (candidate.includes("node:internal")) {
    return true;
  }
  if (candidate.includes("internal/modules")) {
    return true;
  }
  return false;
}

const FRAME_SKIP_PATTERNS = [
  "/node_modules/@autometa/",
  "/packages/scopes/",
  "/packages/runner/",
  "/.autometa-cli/cache/",
];

function isFrameworkFrame(candidate: string): boolean {
  for (const pattern of FRAME_SKIP_PATTERNS) {
    if (candidate.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function applyExecutionModeToHookOptions(
  mode: ExecutionMode,
  options?: HookOptions
): HookOptions | undefined {
  if (!options) {
    return mode === "default" ? undefined : { mode };
  }
  return mode !== "default" ? { ...options, mode } : { ...options };
}

function isScopeOptions(value: unknown): value is ScopeRegistrationOptions {
  return typeof value === "object" && value !== null;
}

function isScopeAction(value: unknown): value is () => void {
  return typeof value === "function";
}

function normalizeScopeArgs(
  kind: ScopeKindKey,
  args: readonly unknown[],
  mode: ExecutionMode
): NormalizedScopeCall {
  const [input, second, third] = args as readonly [unknown?, unknown?, unknown?];

  const baseMetadata = mode === "default" ? createMetadata() : createMetadata({ mode });
  const { name, metadata } = resolveScopeInput(kind, input);
  let mergedMetadata = mergeScopeMetadata(baseMetadata, metadata);

  let action: (() => void) | undefined;

  if (isScopeAction(second)) {
    action = second;
    if (isScopeOptions(third)) {
      mergedMetadata = mergeScopeMetadata(mergedMetadata, extractScopeMetadata(kind, third));
    }
  } else if (isScopeOptions(second)) {
    mergedMetadata = mergeScopeMetadata(mergedMetadata, extractScopeMetadata(kind, second));
    if (isScopeAction(third)) {
      action = third;
    }
  } else if (isScopeAction(third)) {
    action = third;
  }

  const result: NormalizedScopeCall = {
    name,
    metadata: mergedMetadata,
    ...(action ? { action } : {}),
  };
  return result;
}

function resolveScopeInput(
  kind: ScopeKindKey,
  input: unknown
): { name: string; metadata: ScopeMetadata } {
  if (typeof input === "string") {
    const trimmed = input.trim();
    const metadata =
      kind === "feature" && trimmed.endsWith(".feature")
        ? createMetadata({ data: { file: trimmed } })
        : createMetadata();
    return {
      name: trimmed.length > 0 ? trimmed : defaultName(kind),
      metadata,
    };
  }

  if (!isScopeOptions(input)) {
    return { name: defaultName(kind), metadata: {} };
  }

  const descriptor = input as ScopeRegistrationOptions & FeatureDescriptor;
  const explicitName = typeof descriptor.name === "string" ? descriptor.name : undefined;
  const titleName =
    "title" in descriptor && typeof descriptor.title === "string"
      ? descriptor.title
      : undefined;
  const dataName =
    descriptor.data &&
    typeof descriptor.data === "object" &&
    "name" in descriptor.data &&
    typeof (descriptor.data as Record<string, unknown>).name === "string"
      ? ((descriptor.data as Record<string, unknown>).name as string)
      : undefined;
  const name = explicitName ?? titleName ?? dataName ?? defaultName(kind);

  return {
    name,
    metadata: extractScopeMetadata(kind, descriptor),
  };
}

type FeatureDescriptor = Extract<FeatureInput, { readonly file?: string }> &
  ScopeRegistrationOptions & { readonly title?: string };

function extractScopeMetadata(
  kind: ScopeKindKey,
  options: ScopeRegistrationOptions | FeatureDescriptor
): ScopeMetadata {
  const dataEntries = {
    ...(options.data ?? {}),
    ...(kind === "feature" && "file" in options && options.file
      ? { file: options.file }
      : {}),
  };
  return createMetadata({
    ...(options.tags ? { tags: options.tags } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
    ...(options.timeout !== undefined ? { timeout: options.timeout } : {}),
    ...(options.mode !== undefined ? { mode: options.mode } : {}),
    ...(options.source ? { source: options.source } : {}),
    ...(Object.keys(dataEntries).length > 0 ? { data: dataEntries } : {}),
    ...(kind === "scenarioOutline" && options.examples
      ? { examples: cloneExamples(options.examples) }
      : {}),
    ...("pending" in options && options.pending !== undefined
      ? { pending: options.pending }
      : {}),
  });
}

function defaultName(kind: ScopeKindKey) {
  switch (kind) {
    case "feature":
      return FEATURE_DEFAULT_NAME;
    case "scenario":
      return SCENARIO_DEFAULT_NAME;
    case "rule":
      return RULE_DEFAULT_NAME;
    case "scenarioOutline":
      return SCENARIO_OUTLINE_DEFAULT_NAME;
    default:
      return kind;
  }
}

function withExecutionVariants<Args extends unknown[], Return>(
  handler: (mode: ExecutionMode, args: Args) => Return
): ExecutableScopeFn<Args, Return> {
  const fn = ((...args: Args) => handler("default", args)) as ExecutableScopeFn<Args, Return>;
  fn.skip = (...args: Args) => handler("skip", args);
  fn.only = (...args: Args) => handler("only", args);
  fn.failing = (...args: Args) => handler("failing", args);
  fn.concurrent = (...args: Args) => handler("concurrent", args);
  return fn;
}

export function createFeatureBuilder<World>(
  composer: ScopeComposer<World>
): ExecutableScopeFn<
  [FeatureInput, unknown?, unknown?],
  ScopeNode<World>
> {
  return withExecutionVariants((mode, args) => {
    const normalized = normalizeScopeArgs("feature", args, mode);
    return composer.createScope(
      "feature",
      normalized.name,
      normalized.metadata,
      normalized.action,
      FEATURE_ALLOWED_PARENTS
    );
  });
}

export function createScenarioBuilder<World>(
  composer: ScopeComposer<World>,
  kind: "scenario" | "scenarioOutline"
): ExecutableScopeFn<
  [string | ScopeRegistrationOptions, unknown?, unknown?],
  ScopeNode<World>
> {
  return withExecutionVariants((mode, args) => {
    const normalized = normalizeScopeArgs(kind, args, mode);
    const allowedParents = SCENARIO_ALLOWED_PARENTS;
    return composer.createScope(
      kind,
      normalized.name,
      normalized.metadata,
      normalized.action,
      allowedParents
    );
  });
}

export function createRuleBuilder<World>(
  composer: ScopeComposer<World>
): ExecutableScopeFn<
  [string | ScopeRegistrationOptions, unknown?, unknown?],
  ScopeNode<World>
> {
  return withExecutionVariants((mode, args) => {
    const normalized = normalizeScopeArgs("rule", args, mode);
    return composer.createScope(
      "rule",
      normalized.name,
      normalized.metadata,
      normalized.action,
      RULE_ALLOWED_PARENTS
    );
  });
}

export function createStepBuilder<
  World,
  Types extends CucumberExpressionTypeMap
>(
  composer: ScopeComposer<World>,
  keyword: StepKeyword
): StepDsl<World, Types> {
  const buildFamily = (
    inheritedOptions?: StepOptions
  ): StepFamily<World, Types> => {
    const makeInvoker = (mode: ExecutionMode) =>
      <Expression extends StepExpression>(
        expression: Expression,
        handler: StepHandler<
          World,
          StepArgumentsForExpression<
            Expression,
            WithDefaultCucumberExpressionTypes<Types>
          >
        >,
        options?: StepOptions
      ) => {
        const mergedOptions = mergeStepOptions(inheritedOptions, options);
        const source = captureCallSite();
        return composer.registerStep(
          keyword,
          expression,
          handler as StepHandler<World>,
          applyExecutionModeToStepOptions(mode, mergedOptions),
          source
        );
      };

    const defaultFn = makeInvoker("default") as StepDsl<World, Types>;
    const skipFn = makeInvoker("skip") as StepDsl<World, Types>;
    const onlyFn = makeInvoker("only") as StepDsl<World, Types>;
    const failingFn = makeInvoker("failing") as StepDsl<World, Types>;
    const concurrentFn = makeInvoker("concurrent") as StepDsl<World, Types>;

    const attachVariants = (
      fn: StepDsl<World, Types>,
      mode: ExecutionMode
    ) => {
      fn.skip = skipFn;
      fn.only = onlyFn;
      fn.failing = failingFn;
      fn.concurrent = concurrentFn;
      fn.tags = (
        ...inputs: readonly StepTagInput[]
      ) => {
        const normalizedTags = normalizeTagInputs(inputs);
        if (normalizedTags.length === 0) {
          switch (mode) {
            case "skip":
              return skipFn;
            case "only":
              return onlyFn;
            case "failing":
              return failingFn;
            case "concurrent":
              return concurrentFn;
            default:
              return defaultFn;
          }
        }

        const tagOptions: StepOptions = {
          tags: normalizedTags,
        };
        const family = buildFamily(
          mergeStepOptions(inheritedOptions, tagOptions)
        );
        switch (mode) {
          case "skip":
            return family.skip;
          case "only":
            return family.only;
          case "failing":
            return family.failing;
          case "concurrent":
            return family.concurrent;
          default:
            return family.default;
        }
      };
    };

    attachVariants(defaultFn, "default");
    attachVariants(skipFn, "skip");
    attachVariants(onlyFn, "only");
    attachVariants(failingFn, "failing");
    attachVariants(concurrentFn, "concurrent");

    return {
      default: defaultFn,
      skip: skipFn,
      only: onlyFn,
      failing: failingFn,
      concurrent: concurrentFn,
    };
  };

  const family = buildFamily();
  return family.default;
}

interface NormalizedHookArgs<World> {
  readonly description?: string;
  readonly handler: HookHandler<World>;
  readonly options?: HookOptions;
}

function normalizeHookArgs<World>(
  mode: ExecutionMode,
  descriptionOrHandler: string | HookHandler<World>,
  handlerOrOptions?: HookHandler<World> | HookOptions,
  maybeOptions?: HookOptions
): NormalizedHookArgs<World> {
  if (typeof descriptionOrHandler === "function") {
    const baseOptions =
      typeof handlerOrOptions === "object" && handlerOrOptions
        ? (handlerOrOptions as HookOptions)
        : undefined;
    const options = applyExecutionModeToHookOptions(mode, baseOptions);
    return {
      handler: descriptionOrHandler,
      ...(options ? { options } : {}),
    };
  }

  if (typeof handlerOrOptions !== "function") {
    throw new TypeError("Hook handler must be a function");
  }

  const appliedOptions = applyExecutionModeToHookOptions(mode, maybeOptions);

  return {
    description: descriptionOrHandler,
    handler: handlerOrOptions,
    ...(appliedOptions ? { options: appliedOptions } : {}),
  };
}

export function createHookBuilder<World>(
  composer: ScopeComposer<World>,
  type: HookType
): ExecutableScopeFn<[unknown?, unknown?, unknown?], HookDefinition<World>> {
  return withExecutionVariants((mode, args) => {
    const [descriptionOrHandler, handlerOrOptions, maybeOptions] = args;
    const { description, handler, options } = normalizeHookArgs(
      mode,
      descriptionOrHandler as string | HookHandler<World>,
      handlerOrOptions as HookHandler<World> | HookOptions | undefined,
      maybeOptions as HookOptions | undefined
    );
    const source = captureCallSite();
    return composer.registerHook(type, handler, options, description, source);
  });
}
