import type { CoordinateFeatureResult } from "@autometa/coordinator";
import type { SimpleFeature } from "@autometa/gherkin";
import { createContainer, type IContainer } from "@autometa/injection";
import type {
	CucumberExpressionTypeMap,
	DefaultCucumberExpressionTypes,
	WorldFactory,
} from "@autometa/scopes";
import type { RunnerContextOptions } from "../core/runner-context";
import {
	createRunner,
	type RunnerEnvironment,
} from "../dsl/create-runner";
import {
	createGlobalRunner,
	type GlobalRunner,
} from "../dsl/create-global-runner";
import {
	createDecoratorRunner,
	type DecoratorRunnerEnvironment,
} from "../dsl/create-decorator-runner";
import {
	createRunnerDecorators,
	type RunnerDecorators,
} from "../decorators/create-runner-decorators";
import {
	coordinateRunnerFeature,
	type CoordinateRunnerFeatureOptions,
} from "../runtime/coordinate-runner-feature";

type Mutable<T> = {
	-readonly [K in keyof T]: T[K];
};

type MutableRunnerContextOptions<World> = Mutable<RunnerContextOptions<World>>;

export interface AppFactoryContext<World> {
	readonly container: IContainer;
	readonly world: World;
}

type AppFactory<World, App> = (context: AppFactoryContext<World>) => Promise<App>;

type AppFactoryInput<World, App> =
	| App
	| (() => App | Promise<App>)
	| ((context: AppFactoryContext<World>) => App | Promise<App>);

export type WorldWithApp<World, App> = World extends { app: infer _Existing }
	? Omit<World, "app"> & { readonly app: App }
	: World & { readonly app: App };

export interface RunnerStepsSurface<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
> extends RunnerEnvironment<World, ExpressionTypes> {
	readonly globals: GlobalRunner<World, ExpressionTypes>;
	coordinateFeature(
		options: RunnerCoordinateFeatureOptions<World>
	): CoordinateFeatureResult<World>;
}

export interface RunnerDecoratorsSurface<World>
	extends RunnerDecorators<World> {
	readonly environment: DecoratorRunnerEnvironment<World>;
}

export interface RunnerBuilder<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
> {
	configure(
		update:
			| Partial<RunnerContextOptions<World>>
			| ((
				current: RunnerContextOptions<World>
			) => RunnerContextOptions<World>)
	): RunnerBuilder<World, ExpressionTypes>;
	expressionMap<NextExpressionTypes extends CucumberExpressionTypeMap>(): RunnerBuilder<
		World,
		NextExpressionTypes
	>;
	withWorld<NextWorld>(
		factory: WorldFactory<NextWorld>
	): RunnerBuilder<NextWorld, ExpressionTypes>;
	withWorld<Defaults extends Record<string, unknown>>(
		defaults: Defaults
	): RunnerBuilder<World & Defaults, ExpressionTypes>;
	app<App>(
		app: AppFactoryInput<World, App>
	): RunnerBuilder<WorldWithApp<World, App>, ExpressionTypes>;
	steps(): RunnerStepsSurface<World, ExpressionTypes>;
	decorators(): RunnerDecoratorsSurface<World>;
}

export type RunnerCoordinateFeatureOptions<World> = Omit<
	CoordinateRunnerFeatureOptions<World>,
	"environment"
>;

interface BuilderState {
	options: MutableRunnerContextOptions<unknown>;
	worldFactory?: WorldFactory<unknown>;
	appFactory?: AppFactory<unknown, unknown>;
	stepsCache?: StepsCache;
	decoratorsCache?: DecoratorsCache;
	featureRegistry?: FeatureRegistry;
}

interface StepsCache {
	environment: RunnerEnvironment<unknown, CucumberExpressionTypeMap>;
	globals: GlobalRunner<unknown, CucumberExpressionTypeMap>;
	surface: RunnerStepsSurface<unknown, CucumberExpressionTypeMap>;
}

interface DecoratorsCache {
	environment: DecoratorRunnerEnvironment<unknown>;
	surface: RunnerDecoratorsSurface<unknown>;
}


export function createRunnerBuilder<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
>(
	initial?: Partial<RunnerContextOptions<World>>
): RunnerBuilder<World, ExpressionTypes> {
	const state = initializeState(initial);
	return new RunnerBuilderImpl<World, ExpressionTypes>(state);
}

class RunnerBuilderImpl<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap
> implements RunnerBuilder<World, ExpressionTypes> {
	constructor(private readonly state: BuilderState) {}

	configure(
		update:
			| Partial<RunnerContextOptions<World>>
			| ((
				current: RunnerContextOptions<World>
			) => RunnerContextOptions<World>)
	): RunnerBuilder<World, ExpressionTypes> {
		if (typeof update === "function") {
			const current = collectCurrentOptions<World>(this.state);
			const merged = update(current);
			applyOptions(this.state, merged);
			return new RunnerBuilderImpl<World, ExpressionTypes>(this.state);
		}

		applyOptions(this.state, update);
		return new RunnerBuilderImpl<World, ExpressionTypes>(this.state);
	}

	expressionMap<
		NextExpressionTypes extends CucumberExpressionTypeMap
	>(): RunnerBuilder<World, NextExpressionTypes> {
		return new RunnerBuilderImpl<World, NextExpressionTypes>(this.state);
	}

	withWorld<NextWorld>(
		value: WorldFactory<NextWorld> | NextWorld
	): RunnerBuilder<NextWorld, ExpressionTypes> {
		if (typeof value === "function") {
			this.state.worldFactory = value as WorldFactory<unknown>;
		} else {
			const defaults = ensureWorldDefaults(value);
			this.state.worldFactory = createDefaultsWorldFactory(defaults) as WorldFactory<unknown>;
		}
		invalidateCaches(this.state);
		return new RunnerBuilderImpl<NextWorld, ExpressionTypes>(this.state);
	}

	app<App>(
		app: AppFactoryInput<World, App>
	): RunnerBuilder<WorldWithApp<World, App>, ExpressionTypes> {
		this.state.appFactory =
			normalizeAppFactory<World, App>(app) as AppFactory<unknown, unknown>;
		invalidateCaches(this.state);
		return new RunnerBuilderImpl<WorldWithApp<World, App>, ExpressionTypes>(
			this.state
		);
	}

	steps(): RunnerStepsSurface<World, ExpressionTypes> {
		return ensureSteps<World, ExpressionTypes>(this.state);
	}

	decorators(): RunnerDecoratorsSurface<World> {
		return ensureDecorators<World, ExpressionTypes>(this.state);
	}
}

function initializeState<World>(
	initial?: Partial<RunnerContextOptions<World>>
): BuilderState {
	if (!initial) {
		return { options: {} as MutableRunnerContextOptions<unknown> };
	}

	const { worldFactory, ...rest } = initial;
	const state: BuilderState = {
		options: { ...rest } as MutableRunnerContextOptions<unknown>,
		...(worldFactory
			? { worldFactory: worldFactory as WorldFactory<unknown> }
			: {}),
	};
	return state;
}

function collectCurrentOptions<World>(
	state: BuilderState
): RunnerContextOptions<World> {
	const options = {
		...(state.options as MutableRunnerContextOptions<World>),
	} as MutableRunnerContextOptions<World>;
	if (state.worldFactory) {
		options.worldFactory = state.worldFactory as WorldFactory<World>;
	}
	return options as RunnerContextOptions<World>;
}

function applyOptions<World>(
	state: BuilderState,
	options: Partial<RunnerContextOptions<World>>
): void {
	const { worldFactory, ...rest } = options;
	state.options = {
		...state.options,
		...rest,
	} as MutableRunnerContextOptions<unknown>;
	if ("worldFactory" in options) {
		if (worldFactory) {
			state.worldFactory = worldFactory as WorldFactory<unknown>;
		} else {
			delete state.worldFactory;
		}
	}
	invalidateCaches(state);
}

function normalizeAppFactory<World, App>(
	app: AppFactoryInput<World, App>
): AppFactory<World, App> {
	if (typeof app === "function") {
		if (app.length > 0) {
			return async (context) =>
				await (app as (context: AppFactoryContext<World>) => App | Promise<App>)(
					context
				);
		}
		return async () => await (app as () => App | Promise<App>)();
	}
	return async () => app;
}

type WorldDefaults = Record<string, unknown>;

function createDefaultsWorldFactory<Defaults extends WorldDefaults>(
	defaults: Defaults
): WorldFactory<Defaults> {
	const snapshot = cloneDefaults(defaults);
	return async () => cloneDefaults(snapshot);
}

function ensureWorldDefaults(value: unknown): WorldDefaults {
	if (!value || typeof value !== "object") {
		throw new TypeError(
			"withWorld defaults must be a non-null object"
		);
	}
	return value as WorldDefaults;
}

function cloneDefaults<Defaults extends WorldDefaults>(defaults: Defaults): Defaults {
	const structuredCloneFn = (globalThis as {
		structuredClone?: <T>(value: T) => T;
	}).structuredClone;
	if (structuredCloneFn) {
		return structuredCloneFn(defaults);
	}
	return { ...defaults } as Defaults;
}

function invalidateCaches(state: BuilderState): void {
	delete state.stepsCache;
	delete state.decoratorsCache;
}

function ensureSteps<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap
>(state: BuilderState): RunnerStepsSurface<World, ExpressionTypes> {
	let cache = state.stepsCache;
	if (!cache) {
		const options = buildRunnerOptions<World>(state, { includeParameterTypes: true });
		const environment = createRunner<World, ExpressionTypes>(options);
		const globals = createGlobalRunner<World, ExpressionTypes>();
		globals.useEnvironment(environment);
		const surface = attachStepsHelpers(state, environment, globals);
		cache = {
			environment: environment as RunnerEnvironment<
				unknown,
				CucumberExpressionTypeMap
			>,
			globals: globals as GlobalRunner<unknown, CucumberExpressionTypeMap>,
			surface: surface as RunnerStepsSurface<
				unknown,
				CucumberExpressionTypeMap
			>,
		};
		state.stepsCache = cache;
	}
	return cache.surface as RunnerStepsSurface<World, ExpressionTypes>;
}

function ensureDecorators<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap
>(
	state: BuilderState
): RunnerDecoratorsSurface<World> {
	let cache = state.decoratorsCache;
	if (!cache) {
		const steps = ensureSteps<World, ExpressionTypes>(state);
		const options = buildRunnerOptions<World>(state, {
			includeParameterTypes: false,
		});
		const decoratorOptions = {
			...options,
			parameterRegistry: steps.parameterRegistry,
			registerDefaultParameterTypes: false,
		} as RunnerContextOptions<World>;
		const environment = createDecoratorRunner<World>(decoratorOptions);
		const decorators = createRunnerDecorators<World>(environment);
		const surface = attachDecoratorEnvironment(decorators, environment);
		cache = {
			environment: environment as DecoratorRunnerEnvironment<unknown>,
			surface: surface as RunnerDecoratorsSurface<unknown>,
		};
		state.decoratorsCache = cache;
	}
	return cache.surface as RunnerDecoratorsSurface<World>;
}

function buildRunnerOptions<World>(
	state: BuilderState,
	options?: { includeParameterTypes?: boolean }
): RunnerContextOptions<World> {
	const includeParameterTypes = options?.includeParameterTypes ?? true;
	const base = {
		...(state.options as MutableRunnerContextOptions<World>),
	} as MutableRunnerContextOptions<World>;

	if (!includeParameterTypes && "parameterTypes" in base) {
		delete base.parameterTypes;
	}

	const featureRegistry = ensureFeatureRegistry(state);
	const worldFactory = composeWorldFactory<World>(
		state.worldFactory as WorldFactory<World> | undefined,
		state.appFactory as AppFactory<World, unknown> | undefined,
		featureRegistry
	);

	if (worldFactory) {
		base.worldFactory = worldFactory;
	} else if ("worldFactory" in base) {
		delete base.worldFactory;
	}

	return base as RunnerContextOptions<World>;
}

function composeWorldFactory<World>(
	baseFactory: WorldFactory<World> | undefined,
	appFactory: AppFactory<World, unknown> | undefined,
	featureRegistry: FeatureRegistry | undefined
): WorldFactory<World> | undefined {
	if (!baseFactory && !appFactory && !featureRegistry) {
		return undefined;
	}

	const factory = baseFactory ?? (async () => ({} as World));
	return async () => {
		const container = createContainer();
		const world = await factory();
		const asObject = ensureWorldObject(world);
		attachFeatureRegistry(asObject, featureRegistry);
		attachContainer(asObject, container);

		if (appFactory) {
			const resolvedAppFactory = appFactory as AppFactory<World, unknown>;
			const app = await resolvedAppFactory({
				container,
				world: asObject as World,
			});
			(asObject as Record<string, unknown>).app = app;
		}

		return asObject as World;
	};
}

function attachStepsHelpers<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap
>(
	state: BuilderState,
	environment: RunnerEnvironment<World, ExpressionTypes>,
	globals: GlobalRunner<World, ExpressionTypes>
): RunnerStepsSurface<World, ExpressionTypes> {
	if (!("globals" in environment)) {
		Object.defineProperty(environment, "globals", {
			value: globals,
			enumerable: true,
			configurable: true,
		});
	}
	if (!("coordinateFeature" in environment)) {
		Object.defineProperty(environment, "coordinateFeature", {
			value: (options: RunnerCoordinateFeatureOptions<World>) => {
				const registry = ensureFeatureRegistry(state);
				if (options.feature) {
					registry.remember(options.feature);
				}
				return coordinateRunnerFeature<World>({
					environment,
					...options,
				});
			},
			enumerable: true,
			configurable: true,
		});
	}
	return environment as RunnerStepsSurface<World, ExpressionTypes>;
}

function attachDecoratorEnvironment<World>(
	decorators: RunnerDecorators<World>,
	environment: DecoratorRunnerEnvironment<World>
): RunnerDecoratorsSurface<World> {
	if (!("environment" in decorators)) {
		Object.defineProperty(decorators, "environment", {
			value: environment,
			enumerable: true,
			configurable: true,
		});
	}
	return decorators as RunnerDecoratorsSurface<World>;
}

function ensureWorldObject<World>(world: World): Record<string, unknown> {
	if (world && typeof world === "object") {
		return world as Record<string, unknown>;
	}
	return {} as Record<string, unknown>;
}

function attachContainer(world: Record<string, unknown>, container: IContainer): void {
	const descriptor: PropertyDescriptor = {
		value: container,
		configurable: true,
		enumerable: false,
		writable: false,
	};

	if (!Reflect.has(world, "di")) {
		Object.defineProperty(world, "di", descriptor);
	}

	if (!Reflect.has(world, "container")) {
		Object.defineProperty(world, "container", descriptor);
	}
}

function attachFeatureRegistry(
	world: Record<string, unknown>,
	featureRegistry: FeatureRegistry | undefined
): void {
	if (!featureRegistry) {
		return;
	}
	world.features = featureRegistry.snapshot();
}

interface FeatureRegistry {
	readonly remember: (feature: SimpleFeature) => void;
	readonly snapshot: () => SimpleFeature[];
}

function ensureFeatureRegistry(state: BuilderState): FeatureRegistry {
	if (!state.featureRegistry) {
		state.featureRegistry = createFeatureRegistry();
	}
	return state.featureRegistry;
}

function createFeatureRegistry(): FeatureRegistry {
	const byId = new Map<string, SimpleFeature>();
	return {
		remember(feature) {
			const id = feature.uri ?? feature.name;
			if (!id || byId.has(id)) {
				return;
			}
			byId.set(id, feature);
		},
		snapshot() {
			return Array.from(byId.values());
		},
	};
}
