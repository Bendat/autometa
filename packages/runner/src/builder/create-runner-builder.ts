import type { CoordinateFeatureResult } from "@autometa/coordinator";
import type { WorldFactory } from "@autometa/scopes";
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

type AppFactory<App> = () => App | Promise<App>;

export type WorldWithApp<World, App> = World extends { app: infer _Existing }
	? Omit<World, "app"> & { readonly app: App }
	: World & { readonly app: App };

export interface RunnerStepsSurface<World>
	extends RunnerEnvironment<World> {
	readonly globals: GlobalRunner<World>;
	coordinateFeature(
		options: RunnerCoordinateFeatureOptions<World>
	): CoordinateFeatureResult<World>;
}

export interface RunnerDecoratorsSurface<World>
	extends RunnerDecorators<World> {
	readonly environment: DecoratorRunnerEnvironment<World>;
}

export interface RunnerBuilder<World> {
	configure(
		update:
			| Partial<RunnerContextOptions<World>>
			| ((
				current: RunnerContextOptions<World>
			) => RunnerContextOptions<World>)
	): RunnerBuilder<World>;
	withWorld<NextWorld>(
		factory: WorldFactory<NextWorld>
	): RunnerBuilder<NextWorld>;
	app<App>(app: App | AppFactory<App>): RunnerBuilder<WorldWithApp<World, App>>;
	steps(): RunnerStepsSurface<World>;
	decorators(): RunnerDecoratorsSurface<World>;
}

export type RunnerCoordinateFeatureOptions<World> = Omit<
	CoordinateRunnerFeatureOptions<World>,
	"environment"
>;

interface BuilderState {
	options: MutableRunnerContextOptions<unknown>;
	worldFactory?: WorldFactory<unknown>;
	appFactory?: AppFactory<unknown>;
	stepsCache?: StepsCache;
	decoratorsCache?: DecoratorsCache;
}

interface StepsCache {
	environment: RunnerEnvironment<unknown>;
	globals: GlobalRunner<unknown>;
	surface: RunnerStepsSurface<unknown>;
}

interface DecoratorsCache {
	environment: DecoratorRunnerEnvironment<unknown>;
	surface: RunnerDecoratorsSurface<unknown>;
}

export function createRunnerBuilder<World>(
	initial?: Partial<RunnerContextOptions<World>>
): RunnerBuilder<World> {
	const state = initializeState(initial);
	return new RunnerBuilderImpl<World>(state);
}

class RunnerBuilderImpl<World> implements RunnerBuilder<World> {
	constructor(private readonly state: BuilderState) {}

	configure(
		update:
			| Partial<RunnerContextOptions<World>>
			| ((
				current: RunnerContextOptions<World>
			) => RunnerContextOptions<World>)
	): RunnerBuilder<World> {
		const nextState = cloneState(this.state);
		if (typeof update === "function") {
			const current = collectCurrentOptions<World>(this.state);
			const merged = update(current);
			applyOptions(nextState, merged);
			return new RunnerBuilderImpl<World>(nextState);
		}

		applyOptions(nextState, update);
		return new RunnerBuilderImpl<World>(nextState);
	}

	withWorld<NextWorld>(
		factory: WorldFactory<NextWorld>
	): RunnerBuilder<NextWorld> {
		const nextState = cloneState(this.state);
		nextState.worldFactory = factory as WorldFactory<unknown>;
		return new RunnerBuilderImpl<NextWorld>(nextState);
	}

	app<App>(app: App | AppFactory<App>): RunnerBuilder<WorldWithApp<World, App>> {
		const nextState = cloneState(this.state);
		nextState.appFactory = normalizeAppFactory(app) as AppFactory<unknown>;
		return new RunnerBuilderImpl<WorldWithApp<World, App>>(nextState);
	}

	steps(): RunnerStepsSurface<World> {
		return ensureSteps<World>(this.state);
	}

	decorators(): RunnerDecoratorsSurface<World> {
		return ensureDecorators<World>(this.state);
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

function cloneState(state: BuilderState): BuilderState {
	return {
		options: { ...state.options },
		...(state.worldFactory ? { worldFactory: state.worldFactory } : {}),
		...(state.appFactory ? { appFactory: state.appFactory } : {}),
	};
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
}

function normalizeAppFactory<App>(app: App | AppFactory<App>): AppFactory<App> {
	if (typeof app === "function") {
		return async () => await (app as AppFactory<App>)();
	}
	return () => app;
}

function ensureSteps<World>(state: BuilderState): RunnerStepsSurface<World> {
	let cache = state.stepsCache;
	if (!cache) {
		const options = buildRunnerOptions<World>(state, { includeParameterTypes: true });
		const environment = createRunner<World>(options);
		const globals = createGlobalRunner<World>();
		globals.useEnvironment(environment);
		const surface = attachStepsHelpers(environment, globals);
		cache = {
			environment: environment as RunnerEnvironment<unknown>,
			globals: globals as GlobalRunner<unknown>,
			surface: surface as RunnerStepsSurface<unknown>,
		};
		state.stepsCache = cache;
	}
	return cache.surface as RunnerStepsSurface<World>;
}

function ensureDecorators<World>(
	state: BuilderState
): RunnerDecoratorsSurface<World> {
	let cache = state.decoratorsCache;
	if (!cache) {
		const steps = ensureSteps<World>(state);
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

	const worldFactory = composeWorldFactory<World>(
		state.worldFactory as WorldFactory<World> | undefined,
		state.appFactory as AppFactory<unknown> | undefined
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
	appFactory: AppFactory<unknown> | undefined
): WorldFactory<World> | undefined {
	if (!baseFactory && !appFactory) {
		return undefined;
	}

	if (baseFactory && !appFactory) {
		return baseFactory;
	}

	if (!baseFactory && appFactory) {
		return async () => {
			const app = await appFactory();
			return { app } as World;
		};
	}

	const factory = baseFactory ?? (async () => ({} as World));
	return async () => {
		const world = await factory();
		const resolvedAppFactory = appFactory as AppFactory<unknown>;
		const app = await resolvedAppFactory();
		if (world && typeof world === "object") {
			(world as Record<string, unknown>).app = app;
			return world as World;
		}
		return { app } as World;
	};
}

function attachStepsHelpers<World>(
	environment: RunnerEnvironment<World>,
	globals: GlobalRunner<World>
): RunnerStepsSurface<World> {
	if (!("globals" in environment)) {
		Object.defineProperty(environment, "globals", {
			value: globals,
			enumerable: true,
			configurable: true,
		});
	}
	if (!("coordinateFeature" in environment)) {
		Object.defineProperty(environment, "coordinateFeature", {
			value: (options: RunnerCoordinateFeatureOptions<World>) =>
				coordinateRunnerFeature<World>({
					environment,
					...options,
				}),
			enumerable: true,
			configurable: true,
		});
	}
	return environment as RunnerStepsSurface<World>;
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
