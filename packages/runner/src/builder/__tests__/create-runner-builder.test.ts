import { describe, expect, it } from "vitest";
import type { ScopePlan } from "@autometa/scopes";

import {
	createRunnerBuilder,
	type RunnerStepsSurface,
} from "../create-runner-builder";

interface BaseWorld {
	value: number;
}

describe("createRunnerBuilder", () => {
	it("returns steps surface with shared globals", () => {
		const builder = createRunnerBuilder<BaseWorld>();
		const steps = builder.steps();

		expect(typeof steps.feature).toBe("function");
		expect(typeof steps.globals.Given).toBe("function");
		expect(steps.globals.getEnvironment()).toBe(steps);
		steps.given("some step", (world) => {
			world.value += 1;
		});

		const plan = steps.getPlan();
		expect(plan.stepsById.size).toBe(1);
	});

	it("composes world factory with app injection", async () => {
		interface App {
			readonly name: string;
		}

		const builder = createRunnerBuilder<BaseWorld>({
			worldFactory: () => ({ value: 1 }),
		})
			.app<App>(() => ({ name: "test-app" }))
			.withWorld(async () => ({ value: 2 }));

		const steps = builder.steps();
		const plan = steps.getPlan();
		const worldFactory = plan.worldFactory;
		expect(worldFactory).toBeDefined();
		const world = worldFactory ? await worldFactory() : undefined;
		expect(world).toMatchObject({ value: 2, app: { name: "test-app" } });
	});

	it("shares parameter registry between steps and decorators", async () => {
		type World = BaseWorld & { greeting?: string };
		const builder = createRunnerBuilder<World>({
			parameterTypes: [
				{
					name: "shout",
					pattern: /(hello|world)/,
					transform: (value: unknown) =>
						typeof value === "string" ? value.toUpperCase() : value,
				},
			],
		});

		const steps = builder.steps();
		const decorators = builder.decorators();

		expect(steps.lookupParameterType("shout")).toBeDefined();

		const decoratorRegistry =
			decorators.environment.context.parameterRegistry;
		expect(decoratorRegistry).toBe(steps.parameterRegistry);

		const plan = decorators.environment.buildPlan();
		expect(plan.root.children.length).toBe(0);
	});

	it("allows decorator plans to create worlds with app", async () => {
		interface App {
			readonly id: string;
		}

		const builder = createRunnerBuilder<BaseWorld>()
			.configure({
				worldFactory: () => ({ value: 10 }),
			})
			.app<App>({ id: "decorator-app" });

		const decorators = builder.decorators();
		const plan: ScopePlan<BaseWorld & { app: App }> =
			decorators.environment.buildPlan();

		const created = plan.worldFactory ? await plan.worldFactory() : undefined;
		expect(created).toMatchObject({ value: 10, app: { id: "decorator-app" } });
	});

	it("supports configure updater functions", () => {
		const builder = createRunnerBuilder<BaseWorld>({
			defaultMode: "skip",
		})
			.configure((current) => ({
				...current,
				defaultMode: "only",
			}));

		const steps = builder.steps();
		const plan = steps.getPlan();
		expect(plan.root.mode).toBe("only");
	});

	it("reuses cached surfaces for repeated calls", () => {
		const builder = createRunnerBuilder<BaseWorld>();
		const stepsA = builder.steps();
		const stepsB = builder.steps();
		expect(stepsA).toBe(stepsB);

		const decoratorsA = builder.decorators();
		const decoratorsB = builder.decorators();
		expect(decoratorsA).toBe(decoratorsB);
	});

	it("preserves world factory when configure updates unrelated options", async () => {
		const builder = createRunnerBuilder<BaseWorld>()
			.withWorld(() => ({ value: 5 }))
			.configure({ defaultMode: "failing" });

		const steps: RunnerStepsSurface<BaseWorld> = builder.steps();
		const worldFactory = steps.getPlan().worldFactory;
		expect(worldFactory).toBeDefined();
		const world = worldFactory ? await worldFactory() : undefined;
		expect(world).toEqual({ value: 5 });
	});
});
