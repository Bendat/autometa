
export type ScopeKind =
  | "root"
  | "feature"
  | "rule"
  | "scenario"
  | "scenarioOutline";

export type ExecutionMode = "default" | "skip" | "only" | "failing";

export type TimeoutUnit = "ms" | "s" | "m" | "h";

export type TimeoutSpec = number | { readonly duration: number; readonly unit: TimeoutUnit };

export interface SourceRef {
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
}

export interface ScopeMetadata {
  readonly tags?: readonly string[];
  readonly description?: string;
  readonly timeout?: TimeoutSpec;
  readonly mode?: ExecutionMode;
  readonly source?: SourceRef;
  readonly data?: Record<string, unknown>;
  readonly examples?: readonly ScenarioOutlineExamples[];
}

export type StepKeyword = "Given" | "When" | "Then" | "And" | "But";

export interface StepRuntimeOptions<World> {
  readonly world: World;
  readonly interpolatedText: string;
  readonly dataTable?: unknown;
  readonly attachments?: readonly unknown[];
}

export type StepHandler<World, TArgs extends unknown[] = unknown[]> = (
  world: World,
  ...args: TArgs
) => unknown | Promise<unknown>;

export type StepExpression = string | RegExp;

export interface StepDefinition<World> {
  readonly id: string;
  readonly keyword: StepKeyword;
  readonly expression: StepExpression;
  readonly handler: StepHandler<World>;
  readonly options: NormalizedStepOptions;
  readonly source?: SourceRef;
}

export type HookType =
  | "beforeFeature"
  | "afterFeature"
  | "beforeRule"
  | "afterRule"
  | "beforeScenario"
  | "afterScenario"
  | "beforeScenarioOutline"
  | "afterScenarioOutline"
  | "beforeStep"
  | "afterStep";

export type HookHandler<World> = (context: HookContext<World>) => unknown | Promise<unknown>;

export interface HookContext<World> {
  readonly world: World;
  readonly scope: ScopeNode<World>;
  readonly metadata?: Record<string, unknown>;
}

export interface HookDefinition<World> {
  readonly id: string;
  readonly type: HookType;
  readonly description?: string;
  readonly handler: HookHandler<World>;
  readonly options: NormalizedHookOptions;
  readonly source?: SourceRef;
}

export interface StepOptions {
  readonly tags?: readonly string[];
  readonly timeout?: TimeoutSpec;
  readonly mode?: ExecutionMode;
  readonly data?: Record<string, unknown>;
}

export interface HookOptions {
  readonly tags?: readonly string[];
  readonly timeout?: TimeoutSpec;
  readonly order?: number;
  readonly mode?: ExecutionMode;
  readonly data?: Record<string, unknown>;
}

export interface NormalizedStepOptions {
  readonly tags: readonly string[];
  readonly timeout?: TimeoutSpec;
  readonly mode: ExecutionMode;
  readonly data?: Record<string, unknown>;
}

export interface NormalizedHookOptions {
  readonly tags: readonly string[];
  readonly timeout?: TimeoutSpec;
  readonly order?: number;
  readonly mode: ExecutionMode;
  readonly data?: Record<string, unknown>;
}

export interface ScopeNode<World> {
  readonly id: string;
  readonly kind: ScopeKind;
  readonly name: string;
  readonly mode: ExecutionMode;
  readonly tags: readonly string[];
  readonly timeout?: TimeoutSpec;
  readonly description?: string;
  readonly source?: SourceRef;
  readonly data?: Record<string, unknown>;
  readonly examples?: readonly ScenarioOutlineExamples[];
  readonly steps: StepDefinition<World>[];
  readonly hooks: HookDefinition<World>[];
  readonly children: ScopeNode<World>[];
}

export interface ScopePlan<World> {
  readonly root: ScopeNode<World>;
  readonly stepsById: ReadonlyMap<string, StepDefinition<World>>;
  readonly hooksById: ReadonlyMap<string, HookDefinition<World>>;
  readonly scopesById: ReadonlyMap<string, ScopeNode<World>>;
  readonly worldFactory?: WorldFactory<World>;
  readonly parameterRegistry?: ParameterRegistryLike;
}

export type ExecutableScopeFn<Args extends unknown[], Return> = ((...args: Args) => Return) & {
  skip: (...args: Args) => Return;
  only: (...args: Args) => Return;
  failing: (...args: Args) => Return;
};

export interface ScenarioSummary<World> {
  readonly id: string;
  readonly scenario: ScopeNode<World>;
  readonly feature: ScopeNode<World>;
  readonly rule?: ScopeNode<World>;
  readonly ancestors: readonly ScopeNode<World>[];
  readonly steps: readonly StepDefinition<World>[];
}

export interface ScopeExecutionAdapter<World> {
  readonly plan: ScopePlan<World>;
  readonly features: readonly ScopeNode<World>[];
  createWorld(): Promise<World>;
  getScope(id: string): ScopeNode<World> | undefined;
  getSteps(scopeId: string): readonly StepDefinition<World>[];
  getHooks(scopeId: string): readonly HookDefinition<World>[];
  getAncestors(scopeId: string): readonly ScopeNode<World>[];
  listScenarios(): readonly ScenarioSummary<World>[];
  getParameterRegistry(): ParameterRegistryLike | undefined;
}

export interface ParameterRegistryLike {
  readonly lookupByTypeName?: (name: string) => unknown;
  readonly defineParameterType?: (definition: unknown) => void;
}

export type WorldFactory<World> = () => World | Promise<World>;

export interface CreateScopesOptions<World = unknown> {
  readonly idFactory?: () => string;
  readonly defaultMode?: ExecutionMode;
  readonly worldFactory?: WorldFactory<World>;
  readonly parameterRegistry?: ParameterRegistryLike;
}

export interface ScopeRegistrationOptions extends ScopeMetadata {
  readonly name?: string;
}

export type FeatureInput =
  | string
  | (ScopeRegistrationOptions & { readonly title?: string; readonly file?: string });

export interface ScenarioInput extends ScopeRegistrationOptions {
  readonly title: string;
}

export interface ScenarioOutlineExamples {
  readonly name?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly table: readonly (readonly string[])[];
}

export interface DecoratorFeatureDescriptor extends ScopeRegistrationOptions {
  readonly name: string;
}

export interface DecoratorRuleDescriptor extends ScopeRegistrationOptions {
  readonly name: string;
}

export interface DecoratorScenarioDescriptor extends ScopeRegistrationOptions {
  readonly name: string;
  readonly kind: "scenario" | "scenarioOutline";
}

export interface DecoratorStepDescriptor<World> {
  readonly keyword: StepKeyword;
  readonly expression: StepExpression;
  readonly handler: StepHandler<World>;
  readonly options?: StepOptions;
}

export interface DecoratorHookDescriptor<World> {
  readonly type: HookType;
  readonly handler: HookHandler<World>;
  readonly description?: string;
  readonly options?: HookOptions;
}

export type FeatureDsl<World> = ExecutableScopeFn<[FeatureInput, unknown?, unknown?], ScopeNode<World>>;

export type ScopeDsl<World> = ExecutableScopeFn<
  [string | ScopeRegistrationOptions, unknown?, unknown?],
  ScopeNode<World>
>;

export type StepDsl<World> = ExecutableScopeFn<
  [StepExpression, StepHandler<World>, StepOptions?],
  StepDefinition<World>
>;

export type HookDsl<World> = ExecutableScopeFn<[unknown?, unknown?, unknown?], HookDefinition<World>> &
  ((handler: HookHandler<World>, options?: HookOptions) => HookDefinition<World>) &
  ((description: string, handler: HookHandler<World>, options?: HookOptions) => HookDefinition<World>);

export interface ScopesDsl<World> {
  readonly feature: FeatureDsl<World>;
  readonly rule: ScopeDsl<World>;
  readonly scenario: ScopeDsl<World>;
  readonly scenarioOutline: ScopeDsl<World>;
  readonly given: StepDsl<World>;
  readonly when: StepDsl<World>;
  readonly then: StepDsl<World>;
  readonly and: StepDsl<World>;
  readonly but: StepDsl<World>;
  readonly beforeFeature: HookDsl<World>;
  readonly afterFeature: HookDsl<World>;
  readonly beforeRule: HookDsl<World>;
  readonly afterRule: HookDsl<World>;
  readonly beforeScenario: HookDsl<World>;
  readonly afterScenario: HookDsl<World>;
  readonly beforeScenarioOutline: HookDsl<World>;
  readonly afterScenarioOutline: HookDsl<World>;
  readonly beforeStep: HookDsl<World>;
  readonly afterStep: HookDsl<World>;
  readonly plan: () => ScopePlan<World>;
}
