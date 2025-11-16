import { describe, expect, it } from "vitest";

import { createRunner } from "../index";

interface TestWorld {
	readonly counter: number;
}

describe("createRunner", () => {
	it("registers steps within a feature plan", () => {
		const runner = createRunner<TestWorld>();

		runner.feature("Example feature", () => {
			runner.scenario("Example scenario", () => {
				runner.Given("I have {int} cucumbers", () => undefined);
				runner.When("I eat {int} cucumbers", () => undefined);
				runner.Then("I should have {int} cucumbers", () => undefined);
			});
		});

		const plan = runner.plan();
		expect(plan.root.children).toHaveLength(1);
		const [feature] = plan.root.children;
		expect(feature.name).toBe("Example feature");
		const scenario = feature.children[0];
		expect(scenario.steps).toHaveLength(3);
		expect(Array.from(plan.stepsById.values())).toHaveLength(3);
	});

	it("exposes default cucumber parameter types", () => {
		const runner = createRunner<TestWorld>();
		const parameter = runner.lookupParameterType("int");
		expect(parameter).toBeDefined();
	});

	it("allows registering custom parameter types", () => {
		const runner = createRunner<TestWorld>({
			registerDefaultParameterTypes: false,
		});

		runner.defineParameterType({
			name: "greeting",
			pattern: /hello|hi/,
			transform: (value: unknown) =>
				typeof value === "string" ? value.toUpperCase() : String(value ?? ""),
		});

		expect(runner.lookupParameterType("greeting")).toBeDefined();
	});
});
