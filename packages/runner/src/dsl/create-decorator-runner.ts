import {
	DecoratorScopeRegistry,
	type DecoratorFeatureDescriptor,
	type DecoratorRuleDescriptor,
	type DecoratorScenarioDescriptor,
	type HookHandler,
	type HookOptions,
	type HookType,
	type ScopePlan,
	type StepExpression,
	type StepHandler,
	type StepKeyword,
	type StepOptions,
} from "@autometa/scopes";

import {
	RunnerContext,
	type RunnerContextOptions,
	type RunnerScopeOptions,
} from "../core/runner-context";

interface ScenarioContext {
	readonly feature: unknown;
	readonly rule?: unknown;
}

export interface DecoratorRegistrationApi<World> {
	feature(token: unknown, descriptor: DecoratorFeatureDescriptor): void;
	rule(
		featureToken: unknown,
		token: unknown,
		descriptor: DecoratorRuleDescriptor
	): void;
	scenario(
		token: unknown,
		descriptor: DecoratorScenarioDescriptor,
		context: ScenarioContext
	): void;
	step(
		scenarioToken: unknown,
		keyword: StepKeyword,
		expression: StepExpression,
		handler: StepHandler<World>,
		options?: StepOptions
	): void;
	hook(
		scopeToken: unknown,
		type: HookType,
		handler: HookHandler<World>,
		description?: string,
		options?: HookOptions
	): void;
}

export interface DecoratorRunnerEnvironment<World>
	extends DecoratorRegistrationApi<World> {
	readonly context: RunnerContext<World>;
	buildPlan(): ScopePlan<World>;
}

export function createDecoratorRunner<World>(
	options: RunnerContextOptions<World> = {}
): DecoratorRunnerEnvironment<World> {
	const context = new RunnerContext<World>(options);
	const registry = new DecoratorScopeRegistry<World>();
	const scopeOptions = RunnerContext.extractScopeOptions(options);

	return {
		feature(token, descriptor) {
			registry.registerFeature(token, descriptor);
		},
		rule(featureToken, token, descriptor) {
			registry.registerRule(featureToken, token, descriptor);
		},
		scenario(token, descriptor, scenarioContext) {
			registry.registerScenario(token, descriptor, scenarioContext);
		},
		step(scenarioToken, keyword, expression, handler, options) {
			registry.registerStep(scenarioToken, {
				keyword,
				expression,
				handler,
				...(options ? { options } : {}),
			});
		},
		hook(scopeToken, type, handler, description, options) {
			registry.registerHook(scopeToken, {
				type,
				handler,
				...(description ? { description } : {}),
				...(options ? { options } : {}),
			});
		},
		context,
		buildPlan() {
			return registry.build(
				createScopeOptions(scopeOptions, context.parameterRegistryAdapter)
			);
		},
	};
}

function createScopeOptions<World>(
	opts: RunnerScopeOptions<World>,
	parameterRegistry: RunnerContext<World>["parameterRegistryAdapter"]
) {
	return {
		...opts,
		parameterRegistry,
	};
}
