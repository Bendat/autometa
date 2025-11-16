import { describe, expect, it } from "vitest";

import { createDecoratorRunner } from "../create-decorator-runner";

describe("createDecoratorRunner", () => {
	it("builds a scope plan from decorator registrations", () => {
		interface World { count: number }

		const runner = createDecoratorRunner<World>();
		const featureToken = Symbol("feature");
		const scenarioToken = Symbol("scenario");

		runner.feature(featureToken, { name: "Decorator Feature" });
		runner.scenario(
			scenarioToken,
			{ name: "Decorator Scenario", kind: "scenario" },
			{ feature: featureToken }
		);
		runner.step(scenarioToken, "Given", "a setup", () => undefined);
		runner.hook(featureToken, "beforeFeature", () => undefined, "setup");

		const plan = runner.buildPlan();

		expect(plan.root.children).toHaveLength(1);
		const feature = plan.root.children[0];
		expect(feature?.name).toBe("Decorator Feature");
		const scenario = feature?.children[0];
		expect(scenario?.name).toBe("Decorator Scenario");
		expect(scenario?.steps).toHaveLength(1);
		expect(plan.parameterRegistry).toBe(runner.context.parameterRegistryAdapter);
	});

	it("applies scope options such as world factories", async () => {
		interface World { greeting: string }

		const runner = createDecoratorRunner<World>({
			worldFactory: () => ({ greeting: "hello" }),
		});

		const featureToken = Symbol("feature");
		const scenarioToken = Symbol("scenario");

		runner.feature(featureToken, { name: "Feature" });
		runner.scenario(
			scenarioToken,
			{ name: "Scenario", kind: "scenario" },
			{ feature: featureToken }
		);
		runner.step(scenarioToken, "Then", "world greets", (world) => {
			expect(world.greeting).toBe("hello");
		});

		const plan = runner.buildPlan();

		expect(plan.worldFactory).toBeDefined();
		const world = await plan.worldFactory?.();
		expect(world).toEqual({ greeting: "hello" });
	});
});
