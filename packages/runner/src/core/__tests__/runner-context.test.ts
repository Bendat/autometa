import { describe, expect, it, vi } from "vitest";
import type { ParameterTypeDefinition } from "@autometa/cucumber-expressions";
import { ParameterTypeRegistry } from "@cucumber/cucumber-expressions";

import { RunnerContext } from "../runner-context";

describe("RunnerContext", () => {
	it("registers default parameter types by default", () => {
		const context = new RunnerContext();

		expect(context.lookupParameterType("int")).toBeDefined();
	});

	it("can skip default parameter registration", () => {
		const registry = new ParameterTypeRegistry();
		const spy = vi.spyOn(registry, "defineParameterType");

		new RunnerContext({
			registerDefaultParameterTypes: false,
			parameterRegistry: registry,
		});

		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});

	it("registers parameter definitions from options", () => {
		const greeting: ParameterTypeDefinition<unknown> = {
			name: "greeting",
			pattern: /hello|hi/,
			transform: (value) => String(value ?? "").toUpperCase(),
		};

		const context = new RunnerContext({
			registerDefaultParameterTypes: false,
			parameterTypes: [greeting],
		});

		expect(context.lookupParameterType("greeting")).toBeDefined();
	});

	it("uses provided parameter registry instances", () => {
		const registry = new ParameterTypeRegistry();
		const context = new RunnerContext({
			registerDefaultParameterTypes: false,
			parameterRegistry: registry,
		});

		expect(context.parameterRegistry).toBe(registry);

		context.defineParameterType({
			name: "color",
			pattern: /red|blue/,
			transform: (value) => String(value ?? ""),
		});

		expect(registry.lookupByTypeName("color")).toBeDefined();
	});

	it("exposes plan state through the scopes DSL", () => {
		const context = new RunnerContext<{ value: number }>();
		const { feature, scenario, given } = context.scopes;

		feature("Feature example", () => {
			scenario("Scenario example", () => {
				given("a setup", () => undefined);
			});
		});

		const plan = context.plan;
		const nextPlan = context.scopes.plan();

		expect(plan.root.children).toHaveLength(1);
		expect(plan.root.children[0]?.children).toHaveLength(1);
		expect(nextPlan.root).toBe(plan.root);
		expect(nextPlan.stepsById).toBe(plan.stepsById);
	});

	it("extracts scope options without runner specific values", () => {
		const options = {
			defaultMode: "skip" as const,
			registerDefaultParameterTypes: false,
		};

		const scopeOptions = RunnerContext.extractScopeOptions(options);

		expect(scopeOptions).toEqual({ defaultMode: "skip" });
	});
});
