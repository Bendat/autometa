import type { ParameterType } from "@cucumber/cucumber-expressions";
import { ParameterTypeRegistry } from "@cucumber/cucumber-expressions";
import type { ParameterRegistryLike } from "@autometa/scopes";

export interface ParameterRegistryAdapterOptions {
	readonly registry?: ParameterTypeRegistry;
}

export class ParameterRegistryAdapter implements ParameterRegistryLike {
	readonly #registry: ParameterTypeRegistry;

	constructor(options: ParameterRegistryAdapterOptions = {}) {
		this.#registry = options.registry ?? new ParameterTypeRegistry();
	}

	get registry(): ParameterTypeRegistry {
		return this.#registry;
	}

	lookupByTypeName(name: string): ParameterType<unknown> | undefined {
		return this.#registry.lookupByTypeName(name);
	}

	defineParameterType(definition: unknown): ParameterType<unknown> {
		const parameter = definition as ParameterType<unknown>;
		this.#registry.defineParameterType(parameter);
		return parameter;
	}
}

export function createParameterRegistryAdapter(
	options?: ParameterRegistryAdapterOptions
): ParameterRegistryAdapter {
	return new ParameterRegistryAdapter(options);
}
