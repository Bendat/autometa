import type {
	HookDsl,
	ScopePlan,
	ScopesDsl,
	StepArgumentsForExpression,
	StepDefinition,
	StepDsl,
	StepExpression,
	StepHandler,
	StepOptions,
	StepTagInput,
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

export type RuntimeAwareStepHandler<World, TArgs extends unknown[] = unknown[]> = (
	world: World,
	...args: [...TArgs, StepRuntimeHelpers]
) => unknown | Promise<unknown>;

export type RunnerStepHandler<World, TArgs extends unknown[] = unknown[]> =
	| StepHandler<World, TArgs>
	| RuntimeAwareStepHandler<World, TArgs>;

export interface RunnerStepDsl<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap
> {
	<Expression extends StepExpression>(
		expression: Expression,
		handler: RunnerStepHandler<
			World,
			StepArgumentsForExpression<
				Expression,
				WithDefaultCucumberExpressionTypes<ExpressionTypes>
			>
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

function wrapStepHandler<World, TArgs extends unknown[]>(
	handler: RunnerStepHandler<World, TArgs>
): StepHandler<World, TArgs> {
	return ((world: World, ...args: TArgs) => {
		const runtime = createStepRuntime(world);
		const callable = handler as (
			world: World,
			...inputs: [...TArgs, StepRuntimeHelpers]
		) => unknown | Promise<unknown>;
		return callable(world, ...args, runtime);
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

export interface RunnerDsl<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
> extends ScopesDsl<World, WithDefaultCucumberExpressionTypes<ExpressionTypes>> {
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
	readonly BeforeFeature: HookDsl<World>;
	readonly AfterFeature: HookDsl<World>;
	readonly BeforeRule: HookDsl<World>;
	readonly AfterRule: HookDsl<World>;
	readonly BeforeScenario: HookDsl<World>;
	readonly AfterScenario: HookDsl<World>;
	readonly BeforeScenarioOutline: HookDsl<World>;
	readonly AfterScenarioOutline: HookDsl<World>;
	readonly BeforeStep: HookDsl<World>;
	readonly AfterStep: HookDsl<World>;
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
		beforeFeature: scopes.beforeFeature,
		afterFeature: scopes.afterFeature,
		beforeRule: scopes.beforeRule,
		afterRule: scopes.afterRule,
		beforeScenario: scopes.beforeScenario,
		afterScenario: scopes.afterScenario,
		beforeScenarioOutline: scopes.beforeScenarioOutline,
		afterScenarioOutline: scopes.afterScenarioOutline,
		beforeStep: scopes.beforeStep,
		afterStep: scopes.afterStep,
		plan: scopes.plan,
		Given: given,
		When: when,
		Then: then,
		And: and,
		But: but,
		BeforeFeature: scopes.beforeFeature,
		AfterFeature: scopes.afterFeature,
		BeforeRule: scopes.beforeRule,
		AfterRule: scopes.afterRule,
		BeforeScenario: scopes.beforeScenario,
		AfterScenario: scopes.afterScenario,
		BeforeScenarioOutline: scopes.beforeScenarioOutline,
		AfterScenarioOutline: scopes.afterScenarioOutline,
		BeforeStep: scopes.beforeStep,
		AfterStep: scopes.afterStep,
	};

	return environment;
}
