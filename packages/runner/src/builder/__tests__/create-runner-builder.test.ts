import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type {
	ScopeExecutionAdapter,
	ScopeNode,
	ScopePlan,
} from "@autometa/scopes";
import type { SimpleFeature } from "@autometa/gherkin";
import type { ExecutorConfig } from "@autometa/config";
import type { ExecutorRuntime } from "@autometa/executor";
import type { CoordinateFeatureResult } from "@autometa/coordinator";
import type { TestPlan } from "@autometa/test-builder";

import {
	createRunnerBuilder,
	type RunnerStepsSurface,
	type RunnerCoordinateFeatureOptions,
	type RunnerBuilder,
} from "../create-runner-builder";
import { coordinateRunnerFeature } from "../../runtime/coordinate-runner-feature";
import type { DefaultCucumberExpressionTypes } from "@autometa/scopes";

vi.mock("../../runtime/coordinate-runner-feature", () => ({
	coordinateRunnerFeature: vi.fn(),
}));

interface BaseWorld {
	value: number;
}

function createExecutorConfig(): ExecutorConfig {
	return {
		runner: "vitest",
		roots: {
			features: ["features"],
			steps: ["steps"],
		},
	};
}

function createSimpleFeature(name: string): SimpleFeature {
	return {
		id: `feature-${name}`,
		keyword: "Feature",
		language: "en",
		name,
		tags: [],
		elements: [],
		comments: [],
	};
}

function createRuntimeStub(): ExecutorRuntime {
	const suite = ((
		_title: string,
		handler: () => void,
		_timeout?: number
	) => {
		handler();
	}) as ExecutorRuntime["suite"];
	suite.skip = suite;
	suite.only = suite;

	const test = ((
		_title: string,
		handler: () => void | Promise<void>,
		_timeout?: number
	) => {
		const result = handler();
		if (result && typeof (result as Promise<unknown>).then === "function") {
			void (result as Promise<unknown>);
		}
	}) as ExecutorRuntime["test"];
	test.skip = test;
	test.only = test;

	const hook: ExecutorRuntime["beforeAll"] = (handler) => {
		const maybePromise = handler();
		if (maybePromise && typeof (maybePromise as Promise<unknown>).then === "function") {
			void (maybePromise as Promise<unknown>);
		}
	};

	return {
		suite,
		test,
		beforeAll: hook,
		afterAll: hook,
		beforeEach: hook,
		afterEach: hook,
		currentTestName: () => undefined,
		retry: () => undefined,
		warn: () => undefined,
		logError: () => undefined,
	};
}

function createScopeNode<World>(overrides?: Partial<ScopeNode<World>>): ScopeNode<World> {
	const { pending = false, ...rest } = overrides ?? {};
	return {
		id: "scope-id",
		kind: "feature",
		name: "Feature",
		mode: "default",
		tags: [],
		steps: [],
		hooks: [],
		children: [],
		pending,
		...rest,
	};
}

function createPlanStub<World>(
	featureScope: ScopeNode<World>,
	feature: SimpleFeature
): TestPlan<World> {
	return {
		feature: {
			type: "feature",
			name: feature.name,
			keyword: feature.keyword,
			feature,
			scope: featureScope,
			scenarios: [],
			scenarioOutlines: [],
			rules: [],
			listExecutables: () => [],
		},
		listExecutables: () => [],
		listFailed: () => [],
		findById: () => undefined,
		findByQualifiedName: () => undefined,
	};
}

function createAdapterStub<World>(plan: ScopePlan<World>): ScopeExecutionAdapter<World> {
	return {
		plan,
		features: plan.root.children,
		async createWorld(_scope) {
			return { value: 0 } as unknown as World;
		},
		getScope: () => undefined,
		getSteps: () => [],
		getHooks: () => [],
		getAncestors: () => [],
		listScenarios: () => [],
		getParameterRegistry: () => undefined,
	};
}

function createCoordinateResult<World>(
	options: {
		feature: SimpleFeature;
		config: ExecutorConfig;
	}
): CoordinateFeatureResult<World> {
	return {
		feature: options.feature,
		adapter: {} as ScopeExecutionAdapter<World>,
		plan: {} as TestPlan<World>,
		config: options.config,
		register: vi.fn(),
	};
}

describe("createRunnerBuilder", () => {
	it("returns steps surface with shared globals", () => {
		const builder = createRunnerBuilder<BaseWorld>();
		const steps = builder.steps();

		expect(typeof steps.feature).toBe("function");
		expect(typeof steps.globals.Given).toBe("function");
		expect(steps.globals.getEnvironment()).toBe(steps);
		steps.given("some step", (world: BaseWorld) => {
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
			worldFactory: (_context) => ({ value: 1 }),
		})
			.app<App>(() => ({ name: "test-app" }))
			.withWorld(async () => ({ value: 2 }));

		const steps = builder.steps();
		const plan = steps.getPlan();
		const worldFactory = plan.worldFactory;
		expect(worldFactory).toBeDefined();
		const scope = plan.root.children[0] ?? plan.root;
		const world = worldFactory ? await worldFactory({ scope }) : undefined;
		expect(world).toMatchObject({ value: 2, app: { name: "test-app" } });
	});

	it("exposes typed step DSL when expression map is provided", () => {
		interface Expressions extends Record<string, unknown> {
			readonly flag: boolean;
		}

		const builder = createRunnerBuilder<BaseWorld>().expressionMap<Expressions>();
		const steps = builder.steps();

		expectTypeOf(steps).toMatchTypeOf<
			RunnerStepsSurface<BaseWorld, Expressions>
		>();
	});

	it("accepts default world objects", async () => {
		const defaults = {
			value: 5,
			scenarioState: {} as Record<string, unknown>,
		};

		const builder = createRunnerBuilder<BaseWorld>().withWorld(defaults);
		const steps = builder.steps();
		const plan = steps.getPlan();
		const worldFactory = plan.worldFactory;
		expect(worldFactory).toBeDefined();
		const scope = plan.root.children[0] ?? plan.root;
		const createdA = worldFactory ? await worldFactory({ scope }) : undefined;
		const createdB = worldFactory ? await worldFactory({ scope }) : undefined;
		expect(createdA).toMatchObject({
			value: 5,
			scenarioState: {},
			features: [],
		});
		expect(createdB).toMatchObject({
			value: 5,
			scenarioState: {},
			features: [],
		});
		expect(createdA).not.toBe(createdB);
		expect(createdA?.scenarioState).not.toBe(createdB?.scenarioState);
		expectTypeOf(builder).toMatchTypeOf<
			RunnerBuilder<
				{
					value: number;
					scenarioState: Record<string, unknown>;
				},
				DefaultCucumberExpressionTypes
			>
		>();
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
				worldFactory: (_context) => ({ value: 10 }),
			})
			.app<App>({ id: "decorator-app" });

		const decorators = builder.decorators();
		const plan: ScopePlan<BaseWorld & { app: App }> =
			decorators.environment.buildPlan();

		const scope = plan.root.children[0] ?? plan.root;
		const created = plan.worldFactory ? await plan.worldFactory({ scope }) : undefined;
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
		const plan = steps.getPlan();
		const worldFactory = plan.worldFactory;
		expect(worldFactory).toBeDefined();
		const scope = plan.root.children[0] ?? plan.root;
		const world = worldFactory ? await worldFactory({ scope }) : undefined;
		expect(world).toEqual({ value: 5 });
	});

	it("coordinates features using the steps surface helper", () => {
		const builder = createRunnerBuilder<BaseWorld>();
		const steps = builder.steps();
		const feature = createSimpleFeature("Feature");
		const config = createExecutorConfig();
		const result = createCoordinateResult<BaseWorld>({
			feature,
			config,
		});
		vi.mocked(coordinateRunnerFeature).mockReturnValue(
			result as unknown as CoordinateFeatureResult<unknown>
		);

		const coordinated = steps.coordinateFeature({
			feature,
			config,
		});

		expect(coordinateRunnerFeature).toHaveBeenCalledWith({
			environment: steps,
			feature,
			config,
		});
		expect(coordinated).toBe(result);
	});

	it("forwards custom plans and overrides to coordinate features", () => {
		const builder = createRunnerBuilder<BaseWorld>();
		const steps = builder.steps();
		const feature = createSimpleFeature("Coordinated");
		const config = createExecutorConfig();
		const plan = steps.getPlan();
		const runtime = createRuntimeStub();
		const adapterFactory = vi.fn(
			() => createAdapterStub(plan)
		) as RunnerCoordinateFeatureOptions<BaseWorld>["adapterFactory"];
		const featureScope = createScopeNode<BaseWorld>({ id: "feature-scope" });
		const planBuilder = vi.fn(
			() => createPlanStub<BaseWorld>(featureScope, feature)
		) as RunnerCoordinateFeatureOptions<BaseWorld>["planBuilder"];
		const registerPlan = vi.fn() as RunnerCoordinateFeatureOptions<BaseWorld>["registerPlan"];

		steps.coordinateFeature({
			feature,
			config,
			plan,
			runtime,
			adapterFactory,
			planBuilder,
			registerPlan,
			featureScope,
		});

		expect(coordinateRunnerFeature).toHaveBeenCalledWith({
			environment: steps,
			feature,
			config,
			plan,
			runtime,
			adapterFactory,
			planBuilder,
			registerPlan,
			featureScope,
		});
	});
});
