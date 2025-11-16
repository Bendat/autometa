import type {
	DecoratorFeatureDescriptor,
	DecoratorRuleDescriptor,
	DecoratorScenarioDescriptor,
	HookHandler,
	HookOptions,
	HookType,
	StepExpression,
	StepHandler,
	StepKeyword,
	StepOptions,
} from "@autometa/scopes";

export interface ScenarioContext {
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
