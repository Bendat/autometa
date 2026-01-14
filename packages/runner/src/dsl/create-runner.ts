import type {
	HookDsl,
	HookHandler,
	HookRegistration,
	ScopePlan,
	ScopesDsl,
	StepArgumentsForExpression,
	StepDefinition,
	StepDsl,
	StepExpression,
	StepHandler,
	StepOptions,
	StepTagInput,
	HookDefinition,
	HookOptions,
	CucumberExpressionTypeMap,
	DefaultCucumberExpressionTypes,
	WithDefaultCucumberExpressionTypes,
} from "@autometa/scopes";
import type {
	ParameterTypeDefinition,
	ParameterTypeDefinitions,
} from "@autometa/cucumber-expressions";
import type {
	ParameterType,
	ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";

import {
	createStepRuntime,
	type StepRuntimeHelpers,
} from "@autometa/executor";

import {
	RunnerContext,
	type RunnerContextOptions,
} from "../core/runner-context";

type StepHandlerWithOptionalThis<
	World,
	TArgs extends unknown[]
> =
	| ((this: World, ...args: TArgs) => unknown | Promise<unknown>)
	| ((...args: TArgs) => unknown | Promise<unknown>);

export type RuntimeAwareStepHandler<
	World,
	TArgs extends unknown[] = unknown[]
> = StepHandlerWithOptionalThis<
	World,
	[...TArgs, StepRuntimeHelpers, World]
>;

export type RunnerStepHandler<
	World,
	TArgs extends unknown[] = unknown[]
> =
	| StepHandlerWithOptionalThis<World, [...TArgs, World]>
	| RuntimeAwareStepHandler<World, TArgs>;

type StepExpressionArguments<
	Expression extends StepExpression,
	ExpressionTypes extends CucumberExpressionTypeMap
> = StepArgumentsForExpression<
	Expression,
	WithDefaultCucumberExpressionTypes<ExpressionTypes>
>;

export interface RunnerStepDsl<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap
> {
	<Expression extends StepExpression>(
		expression: Expression,
		handler: StepHandlerWithOptionalThis<
			World,
			[
				...StepExpressionArguments<Expression, ExpressionTypes>,
				World
			]
		>,
		options?: StepOptions
	): StepDefinition<World>;
	<Expression extends StepExpression>(
		expression: Expression,
		handler: StepHandlerWithOptionalThis<
			World,
			[
				...StepExpressionArguments<Expression, ExpressionTypes>,
				StepRuntimeHelpers,
				World
			]
		>,
		options?: StepOptions
	): StepDefinition<World>;
	skip: RunnerStepDsl<World, ExpressionTypes>;
	only: RunnerStepDsl<World, ExpressionTypes>;
	failing: RunnerStepDsl<World, ExpressionTypes>;
	concurrent: RunnerStepDsl<World, ExpressionTypes>;
	tags: (
		...tags: readonly StepTagInput[]
	) => RunnerStepDsl<World, ExpressionTypes>;
}

export interface RunnerHookDsl<World> {
	(handler: HookHandler<World>, options?: HookOptions): HookRegistration<World>;
	(
		description: string,
		handler: HookHandler<World>,
		options?: HookOptions
	): HookRegistration<World>;
	skip: RunnerHookDsl<World>;
	only: RunnerHookDsl<World>;
	failing: RunnerHookDsl<World>;
	concurrent: RunnerHookDsl<World>;
}

const hookWrapperCache = new WeakMap<HookDsl<unknown>, RunnerHookDsl<unknown>>();

function wrapHook<World>(hook: HookDsl<World>): RunnerHookDsl<World> {
	if (typeof hook !== "function") {
		throw new TypeError("Hook DSL must be a function");
	}
	const cached = hookWrapperCache.get(hook as HookDsl<unknown>);
	if (cached) {
		return cached as RunnerHookDsl<World>;
	}

	const callable = ((
		first: string | HookHandler<World>,
		second?: HookHandler<World> | HookOptions,
		third?: HookOptions
	) => {
		if (typeof first === "string") {
			return (hook as unknown as (
				description: string,
				handler: HookHandler<World>,
				options?: HookOptions
			) => HookDefinition<World>)(first, second as HookHandler<World>, third);
		}
		return (hook as unknown as (
			handler: HookHandler<World>,
			options?: HookOptions
		) => HookDefinition<World>)(first as HookHandler<World>, second as HookOptions | undefined);
	}) as RunnerHookDsl<World>;

	hookWrapperCache.set(hook as HookDsl<unknown>, callable as RunnerHookDsl<unknown>);

	const assignVariant = (
		variant: keyof RunnerHookDsl<World>,
		source: unknown
	) => {
		if (typeof source === "function") {
			(callable as RunnerHookDsl<World>)[variant] = wrapHook(
				source as HookDsl<World>
			);
		}
	};

	assignVariant("skip", hook.skip);
	assignVariant("only", hook.only);
	assignVariant("failing", hook.failing);
	assignVariant("concurrent", hook.concurrent);

	return callable;
}

function wrapStepHandler<World, TArgs extends unknown[]>(
	handler: RunnerStepHandler<World, TArgs>
): StepHandler<World, TArgs> {
	return ((world: World, ...args: TArgs) => {
		const runtime = createStepRuntime(world);
		const withRuntime = handler as StepHandlerWithOptionalThis<
			World,
			[...TArgs, StepRuntimeHelpers, World]
		>;
		const withoutRuntime = handler as StepHandlerWithOptionalThis<
			World,
			[...TArgs, World]
		>;
		const paramLength = typeof handler === "function" ? handler.length : 0;
		const expectsRuntime = paramLength > args.length + 1;
		const invocationArgs = expectsRuntime
			? [...args, runtime, world]
			: [...args, world];
		const callable = expectsRuntime ? withRuntime : withoutRuntime;
		return Reflect.apply(callable, world, invocationArgs);
	}) as StepHandler<World, TArgs>;
}


function enhanceStepDsl<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap
>(dsl: StepDsl<World, ExpressionTypes>): RunnerStepDsl<World, ExpressionTypes> {
	const cache = new Map<
		StepDsl<World, ExpressionTypes>,
		RunnerStepDsl<World, ExpressionTypes>
	>();

	const convert = (
		source: StepDsl<World, ExpressionTypes>
	): RunnerStepDsl<World, ExpressionTypes> => {
		const existing = cache.get(source);
		if (existing) {
			return existing;
		}

		const invoke = (<Expression extends StepExpression>(
			expression: Expression,
			handler: RunnerStepHandler<
				World,
				StepArgumentsForExpression<
					Expression,
					WithDefaultCucumberExpressionTypes<ExpressionTypes>
				>
			>,
			options?: StepOptions
		) =>
			source(
				expression,
				wrapStepHandler<
					World,
					StepArgumentsForExpression<
						Expression,
						WithDefaultCucumberExpressionTypes<ExpressionTypes>
					>
				>(handler),
				options
			)) as RunnerStepDsl<World, ExpressionTypes>;

		cache.set(source, invoke);

		invoke.skip = convert(source.skip);
		invoke.only = convert(source.only);
		invoke.failing = convert(source.failing);
		invoke.concurrent = convert(source.concurrent);
		invoke.tags = (
			...inputs: readonly StepTagInput[]
		) => convert(source.tags(...inputs));

		return invoke;
	};

	return convert(dsl);
}

type BaseScopesDsl<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap
> = Omit<
	ScopesDsl<World, ExpressionTypes>,
	| "given"
	| "when"
	| "then"
	| "and"
	| "but"
	| "Given"
	| "When"
	| "Then"
	| "And"
	| "But"
	| "beforeFeature"
	| "afterFeature"
	| "beforeRule"
	| "afterRule"
	| "beforeScenario"
	| "afterScenario"
	| "beforeScenarioOutline"
	| "afterScenarioOutline"
	| "beforeStep"
	| "afterStep"
>;

export interface RunnerDsl<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
> extends BaseScopesDsl<World, WithDefaultCucumberExpressionTypes<ExpressionTypes>> {
	readonly given: RunnerStepDsl<World, ExpressionTypes>;
	readonly when: RunnerStepDsl<World, ExpressionTypes>;
	readonly then: RunnerStepDsl<World, ExpressionTypes>;
	readonly and: RunnerStepDsl<World, ExpressionTypes>;
	readonly but: RunnerStepDsl<World, ExpressionTypes>;
	readonly Given: RunnerStepDsl<World, ExpressionTypes>;
	readonly When: RunnerStepDsl<World, ExpressionTypes>;
	readonly Then: RunnerStepDsl<World, ExpressionTypes>;
	readonly And: RunnerStepDsl<World, ExpressionTypes>;
	readonly But: RunnerStepDsl<World, ExpressionTypes>;
	readonly beforeFeature: RunnerHookDsl<World>;
	readonly afterFeature: RunnerHookDsl<World>;
	readonly beforeRule: RunnerHookDsl<World>;
	readonly afterRule: RunnerHookDsl<World>;
	readonly beforeScenario: RunnerHookDsl<World>;
	readonly afterScenario: RunnerHookDsl<World>;
	readonly beforeScenarioOutline: RunnerHookDsl<World>;
	readonly afterScenarioOutline: RunnerHookDsl<World>;
	readonly beforeStep: RunnerHookDsl<World>;
	readonly afterStep: RunnerHookDsl<World>;
	readonly BeforeFeature: RunnerHookDsl<World>;
	readonly AfterFeature: RunnerHookDsl<World>;
	readonly BeforeRule: RunnerHookDsl<World>;
	readonly AfterRule: RunnerHookDsl<World>;
	readonly BeforeScenario: RunnerHookDsl<World>;
	readonly AfterScenario: RunnerHookDsl<World>;
	readonly BeforeScenarioOutline: RunnerHookDsl<World>;
	readonly AfterScenarioOutline: RunnerHookDsl<World>;
	readonly BeforeStep: RunnerHookDsl<World>;
	readonly AfterStep: RunnerHookDsl<World>;
}

export interface RunnerEnvironment<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
> extends RunnerDsl<World, ExpressionTypes> {
	readonly context: RunnerContext<World, ExpressionTypes>;
	readonly parameterRegistry: ParameterTypeRegistry;
	readonly getPlan: () => ScopePlan<World>;
	readonly defineParameterType: (
		definition: ParameterTypeDefinition<World>
	) => ParameterType<unknown>;
	readonly defineParameterTypes: (
		...definitions: ParameterTypeDefinition<World>[]
	) => ParameterTypeRegistry;
	readonly defineParameterTypesFromList: (
		definitions: ParameterTypeDefinitions<World>
	) => ParameterTypeRegistry;
	readonly registerDefaultParameterTypes: () => ParameterTypeRegistry;
	readonly lookupParameterType: (
		name: string
	) => ParameterType<unknown> | undefined;
}

export function createRunner<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
>(
	options: RunnerContextOptions<World> = {}
): RunnerEnvironment<World, ExpressionTypes> {
	const context = new RunnerContext<World, ExpressionTypes>(options);
	const scopes = context.scopes;

	const given = enhanceStepDsl<World, ExpressionTypes>(scopes.given);
	const when = enhanceStepDsl<World, ExpressionTypes>(scopes.when);
	const then = enhanceStepDsl<World, ExpressionTypes>(scopes.then);
	const and = enhanceStepDsl<World, ExpressionTypes>(scopes.and);
	const but = enhanceStepDsl<World, ExpressionTypes>(scopes.but);

	const defineParameterTypesFromList = (
		definitions: ParameterTypeDefinitions<World>
	) => context.defineParameterTypes(...definitions);

	const beforeFeatureHook = wrapHook(scopes.beforeFeature);
	const afterFeatureHook = wrapHook(scopes.afterFeature);
	const beforeRuleHook = wrapHook(scopes.beforeRule);
	const afterRuleHook = wrapHook(scopes.afterRule);
	const beforeScenarioHook = wrapHook(scopes.beforeScenario);
	const afterScenarioHook = wrapHook(scopes.afterScenario);
	const beforeScenarioOutlineHook = wrapHook(scopes.beforeScenarioOutline);
	const afterScenarioOutlineHook = wrapHook(scopes.afterScenarioOutline);
	const beforeStepHook = wrapHook(scopes.beforeStep);
	const afterStepHook = wrapHook(scopes.afterStep);

	const environment: RunnerEnvironment<World, ExpressionTypes> = {
		context,
		parameterRegistry: context.parameterRegistry,
		getPlan: () => context.plan,
		defineParameterType: (definition) => context.defineParameterType(definition),
		defineParameterTypes: (...definitions) =>
			context.defineParameterTypes(...definitions),
		defineParameterTypesFromList,
		registerDefaultParameterTypes: () =>
			context.registerDefaultParameterTypes(),
		lookupParameterType: (name) => context.lookupParameterType(name),
		feature: scopes.feature,
		rule: scopes.rule,
		scenario: scopes.scenario,
		scenarioOutline: scopes.scenarioOutline,
		given,
		when,
		then,
		and,
		but,
		beforeFeature: beforeFeatureHook,
		afterFeature: afterFeatureHook,
		beforeRule: beforeRuleHook,
		afterRule: afterRuleHook,
		beforeScenario: beforeScenarioHook,
		afterScenario: afterScenarioHook,
		beforeScenarioOutline: beforeScenarioOutlineHook,
		afterScenarioOutline: afterScenarioOutlineHook,
		beforeStep: beforeStepHook,
		afterStep: afterStepHook,
		Given: given,
		When: when,
		Then: then,
		And: and,
		But: but,
		plan: scopes.plan,
		BeforeFeature: beforeFeatureHook,
		AfterFeature: afterFeatureHook,
		BeforeRule: beforeRuleHook,
		AfterRule: afterRuleHook,
		BeforeScenario: beforeScenarioHook,
		AfterScenario: afterScenarioHook,
		BeforeScenarioOutline: beforeScenarioOutlineHook,
		AfterScenarioOutline: afterScenarioOutlineHook,
		BeforeStep: beforeStepHook,
		AfterStep: afterStepHook,
	};

	return environment;
}
