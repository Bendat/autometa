import { describe, expect, it } from "vitest";
import { ParameterType } from "@cucumber/cucumber-expressions";

import {
	ParameterRegistryAdapter,
	createParameterRegistryAdapter,
} from "../parameter-registry";

import { ParameterTypeRegistry } from "@cucumber/cucumber-expressions";

describe("ParameterRegistryAdapter", () => {
	it("creates an internal registry when none is provided", () => {
		const adapter = new ParameterRegistryAdapter();

		expect(adapter.registry).toBeInstanceOf(ParameterTypeRegistry);
		expect(adapter.lookupByTypeName("unknown")).toBeUndefined();
	});

	it("wraps a provided registry instance", () => {
		const registry = new ParameterTypeRegistry();
		const adapter = new ParameterRegistryAdapter({ registry });

		const parameter = new ParameterType<unknown>(
			"status",
			/status|state/,
			null,
			(value) => value,
			false,
			false,
			false
		);

		adapter.defineParameterType(parameter);

		expect(adapter.lookupByTypeName("status")).toBe(parameter);
		expect(registry.lookupByTypeName("status")).toBe(parameter);
	});

	it("supports factory helper for consistency", () => {
		const adapter = createParameterRegistryAdapter();
		const parameter = new ParameterType<string>(
			"greeting",
			/hello|hi/,
			null,
			(value) => String(value ?? ""),
			true,
			false,
			false
		);

		adapter.defineParameterType(parameter);

		expect(adapter.lookupByTypeName("greeting")).toBe(parameter);
	});
});
