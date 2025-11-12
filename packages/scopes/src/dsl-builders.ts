import type {
  ExecutableScopeFn,
  ExecutionMode,
  FeatureInput,
  HookDefinition,
  HookHandler,
  HookOptions,
  HookType,
  ScopeKind,
  ScopeMetadata,
  ScopeNode,
  ScopeRegistrationOptions,
  ScenarioOutlineExamples,
  StepDefinition,
  StepExpression,
  StepHandler,
  StepKeyword,
  StepOptions,
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

function createMetadata(partial?: ScopeMetadata): ScopeMetadata {
  if (!partial) {
    return {};
  }
  const { tags, description, timeout, mode, source, data, examples } = partial;
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

  return createMetadata({
    ...(combinedTags.length > 0 ? { tags: combinedTags } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(timeout !== undefined ? { timeout } : {}),
    ...(mode !== undefined ? { mode } : {}),
    ...(source ? { source } : {}),
    ...(Object.keys(data).length > 0 ? { data } : {}),
    ...(examples ? { examples } : {}),
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

export function createStepBuilder<World>(
  composer: ScopeComposer<World>,
  keyword: StepKeyword
): ExecutableScopeFn<
  [StepExpression, StepHandler<World>, StepOptions?],
  StepDefinition<World>
> {
  return withExecutionVariants((mode, args) => {
    const [expression, handler, options] = args;
    return composer.registerStep(
      keyword,
      expression,
      handler,
      applyExecutionModeToStepOptions(mode, options)
    );
  });
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
    return composer.registerHook(type, handler, options, description);
  });
}
