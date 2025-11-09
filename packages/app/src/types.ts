import type { Constructor } from "@autometa/injection";

export type WorldCtor<T extends object> = Constructor<T>;

export type WorldScope = "feature" | "rule" | "outline" | "scenario";

export type OptionalWorld<T> = T extends object ? T : undefined;
export type DefinedWorld<T> = T extends object ? T : never;

export interface ScopeKeys {
  feature?: string;
  rule?: string;
  outline?: string;
  scenario: string;
}

export interface WorldHierarchy<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined
> {
  readonly scenario: TScenario;
  readonly feature: TFeature;
  readonly rule: TRule;
  readonly outline: TOutline;
}

export interface ScopePayloadMap<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined
> {
  readonly feature: { feature: NonNullable<TFeature> };
  readonly rule: { feature: TFeature; rule: NonNullable<TRule> };
  readonly outline: {
    feature: TFeature;
    rule: TRule;
    outline: NonNullable<TOutline>;
  };
  readonly scenario: {
    feature: TFeature;
    rule: TRule;
    outline: TOutline;
    scenario: TScenario;
  };
}

export type ScopePayload<
  Scope extends WorldScope,
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined
> = ScopePayloadMap<TScenario, TFeature, TRule, TOutline>[Scope];

export interface StepRuntimeContext {
  readonly pickle?: {
    readonly id?: string;
    readonly name?: string;
    readonly uri?: string;
    readonly astNodeIds?: string[];
  };
  readonly gherkinDocument?: {
    readonly feature?: {
      readonly name?: string;
      readonly location?: {
        readonly uri?: string;
      };
    };
  };
  [key: string]: unknown;
}

export interface ScopeKeyResolver<Ctx = StepRuntimeContext> {
  feature?: (context: Ctx) => string | undefined;
  rule?: (context: Ctx) => string | undefined;
  outline?: (context: Ctx) => string | undefined;
  scenario: (context: Ctx) => string;
}

export type StepExpression = string | RegExp;

export type StepCallback = (...args: unknown[]) => unknown | Promise<unknown>;

export interface StepRegistrar {
  (expression: StepExpression, handler: StepCallback): void;
}

export interface HookCallback<
  Scope extends WorldScope,
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx = StepRuntimeContext
> {
  (
    payload: ScopePayload<Scope, TScenario, TFeature, TRule, TOutline>,
    context: Ctx
  ): unknown | Promise<unknown>;
}

export interface StepDsl {
  readonly Given: StepRegistrar;
  readonly When: StepRegistrar;
  readonly Then: StepRegistrar;
  readonly And?: StepRegistrar;
  readonly But?: StepRegistrar;
  readonly Before?: (handler: StepCallback) => void;
  readonly After?: (handler: StepCallback) => void;
  readonly BeforeAll?: (handler: StepCallback) => void;
  readonly AfterAll?: (handler: StepCallback) => void;
  readonly defineParameterType?: (definition: ParameterTypeDefinition) => void;
}

export interface ParameterTypeDefinition {
  readonly name: string;
  readonly regexp: RegExp | readonly RegExp[];
  readonly transformer: (...matches: string[]) => unknown;
  readonly useForSnippets?: boolean;
  readonly preferForRegexpMatch?: boolean;
  readonly useRegexMatch?: boolean;
}

export interface StepFactoryOptions<
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx = StepRuntimeContext
> {
  readonly feature?: WorldCtor<DefinedWorld<TFeature>>;
  readonly rule?: WorldCtor<DefinedWorld<TRule>>;
  readonly outline?: WorldCtor<DefinedWorld<TOutline>>;
  readonly dsl?: StepDsl;
  readonly expressions?: readonly ParameterTypeDefinition[];
  readonly keyResolver?: ScopeKeyResolver<Ctx>;
}

export interface StepSuite<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx = StepRuntimeContext
> {
  readonly Given: StepRegistrar;
  readonly When: StepRegistrar;
  readonly Then: StepRegistrar;
  readonly And: StepRegistrar;
  readonly But: StepRegistrar;
  readonly hooks: HookSuite<TScenario, TFeature, TRule, TOutline, Ctx>;
  readonly flow: StepFlowBuilder;
}

export interface HookSuite<
  TScenario extends object,
  TFeature extends object | undefined,
  TRule extends object | undefined,
  TOutline extends object | undefined,
  Ctx = StepRuntimeContext
> {
  readonly BeforeFeature: (
    handler: HookCallback<"feature", TScenario, TFeature, TRule, TOutline, Ctx>
  ) => void;
  readonly AfterFeature: (
    handler: HookCallback<"feature", TScenario, TFeature, TRule, TOutline, Ctx>
  ) => void;
  readonly BeforeRule: (
    handler: HookCallback<"rule", TScenario, TFeature, TRule, TOutline, Ctx>
  ) => void;
  readonly AfterRule: (
    handler: HookCallback<"rule", TScenario, TFeature, TRule, TOutline, Ctx>
  ) => void;
  readonly BeforeOutline: (
    handler: HookCallback<"outline", TScenario, TFeature, TRule, TOutline, Ctx>
  ) => void;
  readonly AfterOutline: (
    handler: HookCallback<"outline", TScenario, TFeature, TRule, TOutline, Ctx>
  ) => void;
  readonly BeforeScenario: (
    handler: HookCallback<"scenario", TScenario, TFeature, TRule, TOutline, Ctx>
  ) => void;
  readonly AfterScenario: (
    handler: HookCallback<"scenario", TScenario, TFeature, TRule, TOutline, Ctx>
  ) => void;
}

export interface StepFlowBuilder {
  readonly given: (expression: StepExpression) => StepFlowRunner;
  readonly when: (expression: StepExpression) => StepFlowRunner;
  readonly then: (expression: StepExpression) => StepFlowRunner;
  readonly and: (expression: StepExpression) => StepFlowRunner;
  readonly but: (expression: StepExpression) => StepFlowRunner;
}

export interface StepFlowRunner {
  run(handler: StepCallback): StepFlowBuilder;
}
