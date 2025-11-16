import type {
	HookDsl,
	ScopePlan,
	ScopesDsl,
	StepDsl,
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
	RunnerContext,
	type RunnerContextOptions,
} from "../core/runner-context";

export interface RunnerDsl<World> extends ScopesDsl<World> {
	readonly Given: StepDsl<World>;
	readonly When: StepDsl<World>;
	readonly Then: StepDsl<World>;
	readonly And: StepDsl<World>;
	readonly But: StepDsl<World>;
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
		given: scopes.given,
		when: scopes.when,
		then: scopes.then,
		and: scopes.and,
		but: scopes.but,
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
		Given: scopes.given,
		When: scopes.when,
		Then: scopes.then,
		And: scopes.and,
		But: scopes.but,
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
