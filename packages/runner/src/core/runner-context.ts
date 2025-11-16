import {
	createDefaultParameterTypes,
	createParameterTypes,
	type CreateParameterTypesOptions,
	type ParameterTypeDefinition,
	type ParameterTypeDefinitions,
} from "@autometa/cucumber-expressions";
import { createScopes } from "@autometa/scopes";
import type {
	CreateScopesOptions,
 CucumberExpressionTypeMap,
	ScopePlan,
	ScopesDsl,
 WithDefaultCucumberExpressionTypes,
 DefaultCucumberExpressionTypes,
} from "@autometa/scopes";
import type {
	ParameterType,
	ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";

import {
	ParameterRegistryAdapter,
	createParameterRegistryAdapter,
} from "./parameter-registry";

export type RunnerScopeOptions<World> = Omit<
	CreateScopesOptions<World>,
	"parameterRegistry"
>;

export interface RunnerContextOptions<World>
	extends RunnerScopeOptions<World> {
	readonly parameterRegistry?: ParameterTypeRegistry;
	readonly parameterTypes?: ParameterTypeDefinitions<World>;
	readonly parameterTypesOptions?: CreateParameterTypesOptions;
	readonly registerDefaultParameterTypes?: boolean;
}

export class RunnerContext<World, ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes> {
	private readonly scopesInternal: ScopesDsl<
		World,
		WithDefaultCucumberExpressionTypes<ExpressionTypes>
	>;
	private readonly registryAdapter: ParameterRegistryAdapter;
	private readonly defineParameterTypeFn: ReturnType<
		typeof createParameterTypes<World>
	>;
	private readonly registerDefaultParameterTypesFn: ReturnType<
		typeof createDefaultParameterTypes<World>
	>;

	constructor(options: RunnerContextOptions<World> = {}) {
		this.registryAdapter = options.parameterRegistry
			? createParameterRegistryAdapter({ registry: options.parameterRegistry })
			: createParameterRegistryAdapter();
		this.defineParameterTypeFn = createParameterTypes<World>(
			options.parameterTypesOptions
		);
		this.registerDefaultParameterTypesFn = createDefaultParameterTypes<World>(
			options.parameterTypesOptions
		);

		const scopeOptions = RunnerContext.extractScopeOptions(options);
		this.scopesInternal = createScopes<World, ExpressionTypes>({
			...scopeOptions,
			parameterRegistry: this.registryAdapter,
		});

		if (options.registerDefaultParameterTypes !== false) {
			this.registerDefaultParameterTypes();
		}

		if (options.parameterTypes && options.parameterTypes.length > 0) {
			this.defineParameterTypes(...options.parameterTypes);
		}
	}

	get scopes(): ScopesDsl<World, WithDefaultCucumberExpressionTypes<ExpressionTypes>> {
		return this.scopesInternal;
	}

	get parameterRegistry(): ParameterTypeRegistry {
		return this.registryAdapter.registry;
	}

	get parameterRegistryAdapter(): ParameterRegistryAdapter {
		return this.registryAdapter;
	}

	get plan(): ScopePlan<World> {
		return this.scopesInternal.plan();
	}

	defineParameterType(
		definition: ParameterTypeDefinition<World>
	): ParameterType<unknown> {
		return this.defineParameterTypeFn(this.parameterRegistry, definition);
	}

	defineParameterTypes(
		...definitions: ParameterTypeDefinition<World>[]
	): ParameterTypeRegistry {
		this.defineParameterTypeFn.many(this.parameterRegistry, ...definitions);
		return this.parameterRegistry;
	}

	registerDefaultParameterTypes(): ParameterTypeRegistry {
		return this.registerDefaultParameterTypesFn(this.parameterRegistry);
	}

	lookupParameterType(name: string): ParameterType<unknown> | undefined {
		return this.parameterRegistry.lookupByTypeName(name);
	}

	static extractScopeOptions<World>(
		options: RunnerContextOptions<World>
	): RunnerScopeOptions<World> {
		const {
			parameterRegistry: _parameterRegistry,
			parameterTypes: _parameterTypes,
			parameterTypesOptions: _parameterTypesOptions,
			registerDefaultParameterTypes: _registerDefaultParameterTypes,
			...scopeOptions
		} = options;
		return scopeOptions;
	}
}
