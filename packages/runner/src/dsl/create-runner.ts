import type {
	HookDsl,
	ScopePlan,
	ScopesDsl,
	StepDefinition,
	StepDsl,
	StepExpression,
	StepHandler,
	StepOptions,
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

type RunnerStepFn<World> = <TArgs extends unknown[]>(
	expression: StepExpression,
	handler: RunnerStepHandler<World, TArgs>,
	options?: StepOptions
) => StepDefinition<World>;

export interface RunnerStepDsl<World> extends RunnerStepFn<World> {
	skip: RunnerStepFn<World>;
	only: RunnerStepFn<World>;
	failing: RunnerStepFn<World>;
}

function wrapStepHandler<World, TArgs extends unknown[]>(
	handler: RunnerStepHandler<World, TArgs>
): StepHandler<World> {
	return ((world: World, ...args: unknown[]) => {
		const runtime = createStepRuntime(world);
		const callable = handler as (
			world: World,
			...inputs: [...TArgs, StepRuntimeHelpers]
		) => unknown | Promise<unknown>;
		return callable(world, ...(args as TArgs), runtime);
	}) as StepHandler<World>;
}

function enhanceStepDsl<World>(dsl: StepDsl<World>): RunnerStepDsl<World> {
	const invoke = (<TArgs extends unknown[]>(
		expression: StepExpression,
		handler: RunnerStepHandler<World, TArgs>,
		options?: StepOptions
	) => dsl(expression, wrapStepHandler<World, TArgs>(handler), options)) as RunnerStepDsl<World>;

	const wrapped = invoke as RunnerStepDsl<World>;
	wrapped.skip = (<TArgs extends unknown[]>(
		expression: StepExpression,
		handler: RunnerStepHandler<World, TArgs>,
		options?: StepOptions
	) => dsl.skip(expression, wrapStepHandler<World, TArgs>(handler), options)) as RunnerStepFn<World>;
	wrapped.only = (<TArgs extends unknown[]>(
		expression: StepExpression,
		handler: RunnerStepHandler<World, TArgs>,
		options?: StepOptions
	) => dsl.only(expression, wrapStepHandler<World, TArgs>(handler), options)) as RunnerStepFn<World>;
	wrapped.failing = (<TArgs extends unknown[]>(
		expression: StepExpression,
		handler: RunnerStepHandler<World, TArgs>,
		options?: StepOptions
	) => dsl.failing(expression, wrapStepHandler<World, TArgs>(handler), options)) as RunnerStepFn<World>;
	return wrapped;
}

export interface RunnerDsl<World> extends ScopesDsl<World> {
	readonly given: RunnerStepDsl<World>;
	readonly when: RunnerStepDsl<World>;
	readonly then: RunnerStepDsl<World>;
	readonly and: RunnerStepDsl<World>;
	readonly but: RunnerStepDsl<World>;
	readonly Given: RunnerStepDsl<World>;
	readonly When: RunnerStepDsl<World>;
	readonly Then: RunnerStepDsl<World>;
	readonly And: RunnerStepDsl<World>;
	readonly But: RunnerStepDsl<World>;
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

export interface RunnerEnvironment<World> extends RunnerDsl<World> {
	readonly context: RunnerContext<World>;
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

export function createRunner<World>(
	options: RunnerContextOptions<World> = {}
): RunnerEnvironment<World> {
	const context = new RunnerContext<World>(options);
	const scopes = context.scopes;

	const given = enhanceStepDsl(scopes.given);
	const when = enhanceStepDsl(scopes.when);
	const then = enhanceStepDsl(scopes.then);
	const and = enhanceStepDsl(scopes.and);
	const but = enhanceStepDsl(scopes.but);

	const defineParameterTypesFromList = (
		definitions: ParameterTypeDefinitions<World>
	) => context.defineParameterTypes(...definitions);

	const environment: RunnerEnvironment<World> = {
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
