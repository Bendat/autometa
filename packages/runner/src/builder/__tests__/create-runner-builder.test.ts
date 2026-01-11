import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type {
	ScopeExecutionAdapter,
	ScopeNode,
	ScopePlan,
	WorldFactory,
} from "@autometa/scopes";
import type { SimpleFeature } from "@autometa/gherkin";
import type { ExecutorConfig } from "@autometa/config";
import type { ExecutorRuntime } from "@autometa/executor";
import type { CoordinateFeatureResult } from "@autometa/coordinator";
import type { TestPlan } from "@autometa/test-builder";
import { Scope } from "@autometa/injection";

import { WORLD_TOKEN } from "../../tokens";

import {
	App,
	createRunnerBuilder,
	STEPS_ENVIRONMENT_META,
	WORLD_INHERIT_KEYS,
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

	it("does not throw when JSON stringifying a world with circular app references", async () => {
		interface App {
			readonly name: string;
			readonly world?: BaseWorld & { app?: App };
		}

		const builder = createRunnerBuilder<BaseWorld>()
			.app<App>((context) => {
				const app: { name: string; world?: BaseWorld & { app?: App } } = { name: "circular-app" };
				app.world = context.world as BaseWorld & { app?: App };
				return app as App;
			})
			.withWorld(() => ({ value: 1 }));

		const steps = builder.steps();
		const plan = steps.getPlan();
		const scope = plan.root.children[0] ?? plan.root;
		const world = plan.worldFactory ? await plan.worldFactory({ scope }) : undefined;
		expect(world).toBeDefined();
		expect(() => JSON.stringify(world)).not.toThrow();
	});

	it("exposes composition helpers in app factory context", async () => {
		interface World extends BaseWorld {
			readonly http: { readonly baseUrl: string };
			readonly baseUrl: string;
		}

		class MemoryService {
			world!: World;
			getWorldValue(): number {
				return this.world.value;
			}
		}

		class App {
			constructor(public readonly memory: MemoryService) {}
		}

		const builder = createRunnerBuilder<World>({
			worldFactory: async () => ({
				value: 7,
				http: { baseUrl: "http://example.com" },
				baseUrl: "http://example.com",
			}) as World,
		})
			.app((compose) => {
				compose.registerClass(MemoryService, {
					scope: Scope.SCENARIO,
					inject: {
						world: { token: WORLD_TOKEN, lazy: true },
					},
				});
				return compose.registerApp(App, {
					deps: [MemoryService],
				});
			});

		const steps = builder.steps();
		const plan = steps.getPlan();
		const worldFactory = plan.worldFactory;
		expect(worldFactory).toBeDefined();
		const scope = plan.root.children[0] ?? plan.root;
		const world = worldFactory ? await worldFactory({ scope }) : undefined;
		expect(world?.app).toBeInstanceOf(App);
		expect(world?.app.memory.getWorldValue()).toBe(7);
	});

	it("fork creates an isolated builder state", () => {
		const base = createRunnerBuilder<BaseWorld>().withWorld({ value: 1 });
		const forked = base.fork().withWorld({ value: 2 });

		const baseSteps = base.steps();
		const forkSteps = forked.steps();

		// Step registries should be isolated.
		baseSteps.given("base step", (world: BaseWorld) => {
			world.value += 1;
		});
		forkSteps.given("fork step", (world: BaseWorld) => {
			world.value += 1;
		});
		const basePlanAfter = baseSteps.getPlan();
		const forkPlanAfter = forkSteps.getPlan();
		expect(basePlanAfter.stepsById.size).toBe(1);
		expect(forkPlanAfter.stepsById.size).toBe(1);

		// World defaults differ.
		expectTypeOf(basePlanAfter.worldFactory).toEqualTypeOf<WorldFactory<BaseWorld> | undefined>();
		expectTypeOf(forkPlanAfter.worldFactory).toEqualTypeOf<WorldFactory<BaseWorld> | undefined>();
	});

	it("derivable/group caches derived builders", () => {
		const root = createRunnerBuilder<BaseWorld>().derivable();
		const a1 = root.group("backoffice");
		const a2 = root.group("backoffice");

		expect(a1.steps()).toBe(a2.steps());
		expect(
			(a1.steps() as unknown as Record<PropertyKey, unknown>)[STEPS_ENVIRONMENT_META]
		).toMatchObject({ kind: "group", group: "backoffice" });

		// Changing the derived builder should persist across group() calls.
		const steps = a1.steps();
		steps.given("group step", (world: BaseWorld) => {
			world.value += 1;
		});
		expect(a2.steps().getPlan().stepsById.size).toBe(1);
	});

	it("extendWorld composes base + extension (extension wins)", async () => {
		interface Base extends BaseWorld {
			readonly baseOnly: string;
		}
		interface Local {
			readonly localOnly: number;
			readonly baseOnly: string;
		}

		const builder = createRunnerBuilder<Base>()
			.withWorld<Base>({ value: 1, baseOnly: "base" })
			.extendWorld<Local>({ localOnly: 123, baseOnly: "local" });

		const plan = builder.steps().getPlan();
		const worldFactory = plan.worldFactory;
		expect(worldFactory).toBeDefined();
		const scope = plan.root.children[0] ?? plan.root;
		const world = worldFactory ? await worldFactory({ scope }) : undefined;
		expect(world).toMatchObject({ value: 1, baseOnly: "local", localOnly: 123 });
	});

	it("extendApp chains factories and allows override", async () => {
		interface World extends BaseWorld {
			readonly app: { readonly name: string };
		}

		let sawBaseApp = false;

		const builder = createRunnerBuilder<World>({
			worldFactory: async () => ({ value: 1 } as World),
		})
			.app(() => ({ name: "base" }))
			.extendApp((context) => {
				const current = (context.world as unknown as { app?: { name: string } }).app;
				if (current?.name === "base") {
					sawBaseApp = true;
				}
				return { name: "derived" };
			});

		const plan = builder.steps().getPlan();
		const worldFactory = plan.worldFactory;
		expect(worldFactory).toBeDefined();
		const scope = plan.root.children[0] ?? plan.root;
		const world = worldFactory ? await worldFactory({ scope }) : undefined;
		expect(sawBaseApp).toBe(true);
		expect(world).toMatchObject({ value: 1, app: { name: "derived" } });
	});

	it("provides composition helper for quick app wiring", async () => {
		class Dependency {
			readonly id = "dependency";
		}

		class TestApp {
			constructor(public readonly dependency: Dependency) {}
		}

		const builder = createRunnerBuilder<BaseWorld>()
			.withWorld(() => ({ value: 3 }))
			.app(
				App.compositionRoot(TestApp, {
					deps: [Dependency],
					setup: (compose) => {
						compose.registerClass(Dependency, { scope: Scope.SCENARIO });
					},
				})
			);

		const steps = builder.steps();
		const plan = steps.getPlan();
		const scope = plan.root.children[0] ?? plan.root;
		const world = plan.worldFactory ? await plan.worldFactory({ scope }) : undefined;
		expect(world?.app).toBeInstanceOf(TestApp);
		expect(world?.app.dependency).toBeInstanceOf(Dependency);
		expect(world?.value).toBe(3);
	});

	it("merges parent world values and records ancestry", async () => {
		interface SharedWorld {
			baseUrl: string;
			value: number;
			ancestors: readonly unknown[];
		}

		const defaults: SharedWorld & {
			readonly [WORLD_INHERIT_KEYS]: readonly (keyof SharedWorld)[];
		} = {
			baseUrl: "feature",
			value: 2,
			ancestors: [] as readonly unknown[],
			[WORLD_INHERIT_KEYS]: ["baseUrl"],
		};

		type SharedWorldWithInheritance = typeof defaults;

		const builder = createRunnerBuilder<SharedWorld>().withWorld(defaults);

		const steps = builder.steps();
		const plan = steps.getPlan();
		const worldFactory = plan.worldFactory;
		expect(worldFactory).toBeDefined();
		if (!worldFactory) {
			throw new Error("worldFactory was not created");
		}
		const typedWorldFactory = worldFactory as WorldFactory<SharedWorldWithInheritance>;

		const featureScope: ScopeNode<SharedWorldWithInheritance> = createScopeNode<SharedWorldWithInheritance>({
			kind: "feature",
			name: "Parent",
		});
		const featureWorld = await typedWorldFactory({ scope: featureScope });
		expect(featureWorld).toMatchObject({ baseUrl: "feature", value: 2 });
		featureWorld.baseUrl = "mutated";
		featureWorld.value = 10;

		const scenarioScope: ScopeNode<SharedWorldWithInheritance> = createScopeNode<SharedWorldWithInheritance>({
			kind: "scenario",
			name: "Scenario",
		});
		const scenarioWorld = await typedWorldFactory({
			scope: scenarioScope,
			parent: featureWorld,
		});

		expect(scenarioWorld.baseUrl).toBe("mutated");
		expect(scenarioWorld.value).toBe(2);
		const ancestors = scenarioWorld.ancestors;
		expect(ancestors).toBeDefined();
		expect(ancestors[0]).toBe(featureWorld);
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
		expect(world).toMatchObject({ value: 5 });
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
