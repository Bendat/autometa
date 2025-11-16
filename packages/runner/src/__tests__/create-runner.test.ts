import { describe, expect, it } from "vitest";

import { createRunner } from "../index";
import {
	setStepTable,
	setStepDocstring,
	clearStepTable,
	clearStepDocstring,
	type StepRuntimeHelpers,
} from "@autometa/executor";

interface TestWorld {
	readonly counter: number;
}

function assertExists<T>(value: T | null | undefined, message: string): asserts value is T {
	if (value === null || value === undefined) {
		throw new Error(message);
	}
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
		assertExists(feature, "Feature scope was not registered");
		expect(feature.name).toBe("Example feature");
		const scenario = feature.children[0];
		assertExists(scenario, "Scenario scope was not registered");
		expect(scenario.steps).toHaveLength(3);
		expect(Array.from(plan.stepsById.values())).toHaveLength(3);
	});

	it("exposes default cucumber parameter types", () => {
		const runner = createRunner<TestWorld>();
		const parameter = runner.lookupParameterType("int");
		expect(parameter).toBeDefined();
	});

	it("supports tagging step definitions via the fluent API", () => {
		const runner = createRunner<TestWorld>();

		runner.feature("Tagged feature", () => {
			runner.scenario("Tagged scenario", () => {
				runner.When.tags("@api")("a tagged step", () => undefined);
				runner.Then.tags(["@validation"])("a tagged assertion", () => undefined, {
					tags: ["@response"],
				});
			});
		});

		const plan = runner.plan();
		const [feature] = plan.root.children;
		assertExists(feature, "Tagged feature scope missing");
		const [scenario] = feature.children;
		assertExists(scenario, "Tagged scenario scope missing");
		const [whenStep, thenStep] = scenario.steps;
		assertExists(whenStep, "Tagged When step missing");
		assertExists(thenStep, "Tagged Then step missing");

		expect(whenStep.options.tags).toEqual(["@api"]);
		expect(thenStep.options.tags).toEqual(["@validation", "@response"]);
	});

	it("exposes concurrent execution variant for steps", () => {
		const runner = createRunner<TestWorld>();

		runner.feature("Concurrent feature", () => {
			runner.scenario("Concurrent scenario", () => {
				runner.When.concurrent("a concurrent action", () => undefined);
				runner.Then.tags("@fast").concurrent(
					"a concurrent assertion",
					() => undefined,
					{ tags: ["@extra"] }
				);
			});
		});

		const plan = runner.plan();
		const [feature] = plan.root.children;
		assertExists(feature, "Concurrent feature scope missing");
		const [scenario] = feature.children;
		assertExists(scenario, "Concurrent scenario scope missing");
		const [whenStep, thenStep] = scenario.steps;
		assertExists(whenStep, "Concurrent When step missing");
		assertExists(thenStep, "Concurrent Then step missing");

		expect(whenStep.options.mode).toBe("concurrent");
		expect(thenStep.options.mode).toBe("concurrent");
		expect(thenStep.options.tags).toEqual(["@fast", "@extra"]);
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

	it("provides runtime helpers to step handlers", async () => {
		const runner = createRunner<TestWorld>();

		let capturedRow: Record<string, unknown> | undefined;
		let capturedDocstring: string | undefined;
		let consumedDocstring: string | undefined;
		let flags:
			| {
				beforeTable: boolean;
				afterTable: boolean;
				beforeDocstring: boolean;
				afterDocstring: boolean;
			}
			| undefined;

		runner.feature("Runtime feature", () => {
			runner.scenario("Runtime scenario", () => {
				runner.Given("a runtime-enabled step", (_world: TestWorld, runtime: StepRuntimeHelpers) => {
					const beforeTable = runtime.hasTable;
					const beforeDocstring = runtime.hasDocstring;
					const table = runtime.getTable("horizontal");
					capturedRow = table?.getRow(0);
					capturedDocstring = runtime.getDocstring();
					runtime.consumeTable("horizontal");
					runtime.consumeDocstring();
					flags = {
						beforeTable,
						afterTable: runtime.hasTable,
						beforeDocstring,
						afterDocstring: runtime.hasDocstring,
					};
					consumedDocstring = runtime.consumeDocstring();
				});
			});
		});

		const plan = runner.plan();
		const [feature] = plan.root.children;
		assertExists(feature, "Feature scope missing for runtime test");
		const [scenario] = feature.children;
		assertExists(scenario, "Scenario scope missing for runtime test");
		const [step] = scenario.steps;
		assertExists(step, "Step definition missing for runtime test");

		const world: (TestWorld & Record<string, unknown>) = { counter: 0 };
		setStepTable(world, [
			["id", "flag"],
			["1", "true"],
		]);
		setStepDocstring(world, "docstring value");

		await step.handler(world);

		clearStepTable(world);
		clearStepDocstring(world);

		expect(capturedRow).toEqual({ id: 1, flag: true });
		expect(capturedDocstring).toBe("docstring value");
		expect(consumedDocstring).toBeUndefined();
		expect(flags).toMatchObject({
			beforeTable: true,
			afterTable: false,
			beforeDocstring: true,
			afterDocstring: false,
		});
	});
});
