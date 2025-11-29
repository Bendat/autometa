import {
	createDefaultEnsureFactory,
	createEnsureFactory,
	ensure as baseEnsure,
	type AssertionPlugin,
	type EnsureFacade,
	type EnsureInvoke,
	type EnsurePluginFacets,
	type EnsureFactory,
	type EnsureOptions,
	type EnsureChain,
} from "@autometa/assertions";
import type { CoordinateFeatureResult } from "@autometa/coordinator";
import type { SimpleFeature } from "@autometa/gherkin";
import {
	createContainer,
	Scope,
	type Constructor,
	type IContainer,
	type Identifier,
	type RegistrationOptions,
	type Token,
} from "@autometa/injection";
import { createStepRuntime, tryGetWorld } from "@autometa/executor";
import type {
	CucumberExpressionTypeMap,
	DefaultCucumberExpressionTypes,
	WorldFactory,
	WorldFactoryContext,
} from "@autometa/scopes";
import type { ParameterTypeDefinitions } from "@autometa/cucumber-expressions";
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
import { WORLD_TOKEN } from "../tokens";

type Mutable<T> = {
	-readonly [K in keyof T]: T[K];
};

function normalizeWorldFactory<World>(
	factory: WorldFactory<World> | (() => World | Promise<World>)
): WorldFactory<World> {
	const callable = factory as (...args: readonly unknown[]) =>
		World | Promise<World>;
	if (callable.length >= 1) {
		return factory as WorldFactory<World>;
	}
	return async (_context: WorldFactoryContext<World>) =>
		await callable();
}

type MutableRunnerContextOptions<World> = Mutable<RunnerContextOptions<World>>;

export type DefaultEnsureFacets = Record<string, never>;

export type RunnerEnsureFactory<
	World,
	Facets extends Record<string, unknown>
> = Facets & {
	(world: World): EnsureFacade<World, Facets>;
	<T>(value: T, options?: EnsureOptions): EnsureChain<T>;
	readonly world: World;
};

export type AssertionSetup<
	World,
	Facets extends Record<string, unknown>
> = (ensure: EnsureInvoke) => RunnerEnsureFactory<World, Facets>;

export const WORLD_INHERIT_KEYS: unique symbol = Symbol("autometa.runner.world.inherit");

type WorldInheritanceMetadata = ReadonlySet<PropertyKey>;

type WorldFactoryWithInheritance<World> = WorldFactory<World> & {
	readonly [WORLD_INHERIT_KEYS]?: WorldInheritanceMetadata;
};

type AppPropertyInjection =
	| Identifier
	| {
		readonly token: Identifier;
		readonly lazy?: boolean;
	};

export interface AppClassRegistrationOptions {
	readonly scope?: Scope;
	readonly tags?: readonly string[];
	readonly deps?: readonly Identifier[];
	readonly inject?: Record<PropertyKey, AppPropertyInjection>;
}

export interface AppRegistrationOptions<App, World> extends AppClassRegistrationOptions {
	readonly configure?: (
		instance: App,
		context: AppFactoryContext<World>
	) => void | Promise<void>;
}

export interface AppCompositionOptions<App, World> extends AppRegistrationOptions<App, World> {
	readonly setup?: (context: AppFactoryContext<World>) => void | Promise<void>;
}

export interface AppFactoryContext<World> {
	readonly container: IContainer;
	readonly world: World;
	registerClass<T>(
		target: Constructor<T>,
		options?: AppClassRegistrationOptions
	): AppFactoryContext<World>;
	registerValue<T>(
		identifier: Identifier<T>,
		value: T,
		options?: RegistrationOptions
	): AppFactoryContext<World>;
	registerFactory<T>(
		identifier: Identifier<T>,
		factory: (container: IContainer) => T,
		options?: RegistrationOptions
	): AppFactoryContext<World>;
	registerToken<T>(
		token: Token<T>,
		target: Constructor<T> | ((container: IContainer) => T),
		options?: RegistrationOptions
	): AppFactoryContext<World>;
	registerApp<T>(
		target: Constructor<T>,
		options?: AppRegistrationOptions<T, World>
	): Promise<T>;
	resolve<T>(identifier: Identifier<T>): T;
}

export const App = {
	compositionRoot<World, AppInstance>(
		ctor: Constructor<AppInstance>,
		options?: AppCompositionOptions<AppInstance, World>
	): AppFactoryInput<World, AppInstance> {
		return async (context) => {
			const { setup, ...registration } = options ?? {};
			if (setup) {
				await setup(context);
			}
			return context.registerApp(
				ctor,
				registration as AppRegistrationOptions<AppInstance, World>
			);
		};
	},
};

type AppFactory<World, App> = (context: AppFactoryContext<World>) => App | Promise<App>;

type AppFactoryInput<World, App> =
	| App
	| (() => App | Promise<App>)
	| ((context: AppFactoryContext<World>) => App | Promise<App>);

export type WorldWithApp<World, App> = World extends { app: infer _Existing }
	? Omit<World, "app"> & { readonly app: App }
	: World & { readonly app: App };

export interface RunnerStepsSurface<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes,
	Facets extends Record<string, unknown> = DefaultEnsureFacets
> extends RunnerEnvironment<World, ExpressionTypes> {
	readonly globals: GlobalRunner<World, ExpressionTypes>;
	coordinateFeature(
		options: RunnerCoordinateFeatureOptions<World>
	): CoordinateFeatureResult<World>;
	readonly ensure: RunnerEnsureFactory<World, Facets>;
}

export interface RunnerDecoratorsSurface<World>
	extends RunnerDecorators<World> {
	readonly environment: DecoratorRunnerEnvironment<World>;
}

export interface RunnerBuilder<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes,
	Facets extends Record<string, unknown> = DefaultEnsureFacets
> {
	configure(
		update:
			| Partial<RunnerContextOptions<World>>
			| ((
				current: RunnerContextOptions<World>
			) => RunnerContextOptions<World>)
	): RunnerBuilder<World, ExpressionTypes, Facets>;
	expressionMap<NextExpressionTypes extends CucumberExpressionTypeMap>(): RunnerBuilder<
		World,
		NextExpressionTypes,
		Facets
	>;
	withWorld<NextWorld = World>(
		value?: Partial<NextWorld> | WorldFactory<NextWorld>
	): RunnerBuilder<NextWorld, ExpressionTypes, DefaultEnsureFacets>;
	app<App>(
		app: AppFactoryInput<World, App>
	): RunnerBuilder<
		WorldWithApp<World, App>,
		ExpressionTypes,
		DefaultEnsureFacets
	>;
	assertions<
		NextFacets extends Record<string, unknown>
	>(
		setup: AssertionSetup<World, NextFacets>
	): RunnerBuilder<World, ExpressionTypes, NextFacets>;
	assertionPlugins<
		NextPlugins extends Record<string, AssertionPlugin<World, unknown>>
	>(
		plugins: NextPlugins
	): RunnerBuilder<
		World,
		ExpressionTypes,
		EnsurePluginFacets<World, NextPlugins>
	>;
	parameterTypes(
		definitions: ParameterTypeDefinitions<World>
	): RunnerBuilder<World, ExpressionTypes, Facets>;
	steps(): RunnerStepsSurface<World, ExpressionTypes, Facets>;
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
	ensureFactory?: RunnerEnsureFactory<unknown, Record<string, unknown>>;
	stepsCache?: StepsCache;
	decoratorsCache?: DecoratorsCache;
	featureRegistry?: FeatureRegistry;
}

interface StepsCache {
	environment: RunnerEnvironment<unknown, CucumberExpressionTypeMap>;
	globals: GlobalRunner<unknown, CucumberExpressionTypeMap>;
	surface: RunnerStepsSurface<
		unknown,
		CucumberExpressionTypeMap,
		Record<string, unknown>
	>;
	ensureFactory: RunnerEnsureFactory<unknown, Record<string, unknown>>;
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
): RunnerBuilder<World, ExpressionTypes, DefaultEnsureFacets> {
	const state = initializeState(initial);
	return new RunnerBuilderImpl<
		World,
		ExpressionTypes,
		DefaultEnsureFacets
	>(state);
}

class RunnerBuilderImpl<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap,
	Facets extends Record<string, unknown>
> implements RunnerBuilder<World, ExpressionTypes, Facets> {
	constructor(private readonly state: BuilderState) {}

	configure(
		update:
			| Partial<RunnerContextOptions<World>>
			| ((
				current: RunnerContextOptions<World>
			) => RunnerContextOptions<World>)
	): RunnerBuilder<World, ExpressionTypes, Facets> {
		if (typeof update === "function") {
			const current = collectCurrentOptions<World>(this.state);
			const merged = update(current);
			applyOptions(this.state, merged);
			return new RunnerBuilderImpl<World, ExpressionTypes, Facets>(
				this.state
			);
		}

		applyOptions(this.state, update);
		return new RunnerBuilderImpl<World, ExpressionTypes, Facets>(
			this.state
		);
	}

	expressionMap<
		NextExpressionTypes extends CucumberExpressionTypeMap
	>(): RunnerBuilder<World, NextExpressionTypes, Facets> {
		return new RunnerBuilderImpl<World, NextExpressionTypes, Facets>(
			this.state
		);
	}

	withWorld<NextWorld = World>(
		value?: Partial<NextWorld> | WorldFactory<NextWorld>
	): RunnerBuilder<NextWorld, ExpressionTypes, DefaultEnsureFacets> {
		if (typeof value === "function") {
			this.state.worldFactory = normalizeWorldFactory<NextWorld>(
				value as
					| WorldFactory<NextWorld>
					| (() => NextWorld | Promise<NextWorld>)
			) as WorldFactory<unknown>;
		} else if (value) {
			const validated = ensureWorldDefaults(value);
			this.state.worldFactory = createDefaultsWorldFactory(validated) as WorldFactory<unknown>;
		} else {
			this.state.worldFactory = async (_context) => ({} as NextWorld);
		}
		delete this.state.ensureFactory;
		invalidateCaches(this.state);
		return new RunnerBuilderImpl<
			NextWorld,
			ExpressionTypes,
			DefaultEnsureFacets
		>(this.state) as RunnerBuilder<
			NextWorld,
			ExpressionTypes,
			DefaultEnsureFacets
		>;
	}

	app<App>(
		app: AppFactoryInput<World, App>
	): RunnerBuilder<
		WorldWithApp<World, App>,
		ExpressionTypes,
		DefaultEnsureFacets
	> {
		this.state.appFactory =
			normalizeAppFactory<World, App>(app) as AppFactory<unknown, unknown>;
		delete this.state.ensureFactory;
		invalidateCaches(this.state);
		return new RunnerBuilderImpl<
			WorldWithApp<World, App>,
			ExpressionTypes,
			DefaultEnsureFacets
		>(this.state) as RunnerBuilder<
			WorldWithApp<World, App>,
			ExpressionTypes,
			DefaultEnsureFacets
		>;
	}

	assertions<
		NextFacets extends Record<string, unknown>
	>(
		setup: AssertionSetup<World, NextFacets>
	): RunnerBuilder<World, ExpressionTypes, NextFacets> {
		this.state.ensureFactory = setup(baseEnsure) as RunnerEnsureFactory<
			unknown,
			Record<string, unknown>
		>;
		invalidateCaches(this.state);
		return new RunnerBuilderImpl<World, ExpressionTypes, NextFacets>(
			this.state
		);
	}

	assertionPlugins<
		NextPlugins extends Record<string, AssertionPlugin<World, unknown>>
	>(
		plugins: NextPlugins
	): RunnerBuilder<
		World,
		ExpressionTypes,
		EnsurePluginFacets<World, NextPlugins>
	> {
		return this.assertions<EnsurePluginFacets<World, NextPlugins>>(
			(ensureInvoke) => {
				const factory = createEnsureFactory<World, NextPlugins>(
					ensureInvoke,
					plugins
				);
				return createImplicitEnsureProxy(factory);
			}
		);
	}

	parameterTypes(
		definitions: ParameterTypeDefinitions<World>
	): RunnerBuilder<World, ExpressionTypes, Facets> {
		const current = this.state.options.parameterTypes ?? [];
		this.state.options.parameterTypes = [
			...current,
			...(definitions as ParameterTypeDefinitions<unknown>),
		] as ParameterTypeDefinitions<unknown>;
		invalidateCaches(this.state);
		return new RunnerBuilderImpl<World, ExpressionTypes, Facets>(this.state);
	}

	steps(): RunnerStepsSurface<World, ExpressionTypes, Facets> {
		return ensureSteps<World, ExpressionTypes, Facets>(this.state);
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
	};

	if (worldFactory) {
		state.worldFactory = normalizeWorldFactory<unknown>(
			worldFactory as
				| WorldFactory<unknown>
				| (() => unknown | Promise<unknown>)
		);
	}
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
			state.worldFactory = normalizeWorldFactory<unknown>(
				worldFactory as
					| WorldFactory<unknown>
					| (() => unknown | Promise<unknown>)
			);
		} else {
			delete state.worldFactory;
		}
		delete state.ensureFactory;
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

type WorldDefaultsWithMetadata = WorldDefaults & {
	readonly [WORLD_INHERIT_KEYS]?: readonly PropertyKey[];
};

function createDefaultsWorldFactory<Defaults extends WorldDefaults>(
	defaults: Defaults
): WorldFactory<Defaults> {
	const inheritance = extractWorldInheritance(defaults as WorldDefaultsWithMetadata);
	const snapshot = cloneDefaults(defaults);
	const factory: WorldFactoryWithInheritance<Defaults> = async () => cloneDefaults(snapshot);
	if (inheritance.size > 0) {
		Object.defineProperty(factory, WORLD_INHERIT_KEYS, {
			value: inheritance,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	}
	return factory;
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
		try {
			return structuredCloneFn(defaults);
		} catch {
			// Fall through to manual clone strategy when structured cloning fails.
		}
	}
	return cloneWithFallback(defaults);
}

function extractWorldInheritance(
	defaults: WorldDefaultsWithMetadata
): WorldInheritanceMetadata {
	const inherit = defaults[WORLD_INHERIT_KEYS];
	if (!inherit || inherit.length === 0) {
		return new Set();
	}
	const inheritance = new Set<PropertyKey>(inherit);
	return inheritance;
}

function getWorldInheritance(
	factory: WorldFactory<unknown> | undefined
): WorldInheritanceMetadata | undefined {
	if (!factory) {
		return undefined;
	}
	const withMetadata = factory as WorldFactoryWithInheritance<unknown>;
	return withMetadata[WORLD_INHERIT_KEYS];
}

function cloneWithFallback<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item) => cloneWithFallback(item)) as unknown as T;
	}
	if (value instanceof Map) {
		return new Map(
			Array.from(value.entries(), ([key, entry]) => [key, cloneWithFallback(entry)])
		) as unknown as T;
	}
	if (value instanceof Set) {
		return new Set(Array.from(value.values(), (entry) => cloneWithFallback(entry))) as unknown as T;
	}
	if (value && typeof value === "object") {
		const prototype = Object.getPrototypeOf(value as object);
		if (prototype === Object.prototype || prototype === null) {
			const result: Record<string, unknown> = {};
			for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
				result[key] = cloneWithFallback(entry);
			}
			return result as T;
		}
	}
	return value;
}

function invalidateCaches(state: BuilderState): void {
	delete state.stepsCache;
	delete state.decoratorsCache;
}

function ensureSteps<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap,
	Facets extends Record<string, unknown>
>(state: BuilderState): RunnerStepsSurface<World, ExpressionTypes, Facets> {
	let cache = state.stepsCache;
	if (!cache) {
		const options = buildRunnerOptions<World>(state, { includeParameterTypes: true });
		const environment = createRunner<World, ExpressionTypes>(options);
		const globals = createGlobalRunner<World, ExpressionTypes>();
		globals.useEnvironment(environment);
		const ensureFactory = resolveEnsureFactory<World, Facets>(state);
		const surface = attachStepsHelpers(
			state,
			environment,
			globals,
			ensureFactory
		);
		cache = {
			environment: environment as RunnerEnvironment<
				unknown,
				CucumberExpressionTypeMap
			>,
			globals: globals as GlobalRunner<unknown, CucumberExpressionTypeMap>,
			surface: surface as RunnerStepsSurface<
				unknown,
				CucumberExpressionTypeMap,
				Record<string, unknown>
			>,
			ensureFactory: ensureFactory as RunnerEnsureFactory<
				unknown,
				Record<string, unknown>
			>,
		};
		state.stepsCache = cache;
	}
	return cache.surface as RunnerStepsSurface<World, ExpressionTypes, Facets>;
}

function ensureDecorators<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap
>(
	state: BuilderState
): RunnerDecoratorsSurface<World> {
	let cache = state.decoratorsCache;
	if (!cache) {
		const steps = ensureSteps<
			World,
			ExpressionTypes,
			DefaultEnsureFacets
		>(state);
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

	const factory =
		baseFactory ?? (async (_context: WorldFactoryContext<World>) => ({} as World));
	const inheritance = getWorldInheritance(baseFactory as WorldFactory<unknown> | undefined);
	return async (context: WorldFactoryContext<World>) => {
		const container = createContainer();
		const world = await factory(context);
		const asObject = ensureWorldObject(world);
		const parentObject =
			context.parent !== undefined
				? ensureWorldObject(context.parent)
				: undefined;
		const mergedWorld =
			parentObject !== undefined
				? mergeWorldWithParent(asObject, parentObject, inheritance)
				: asObject;
		attachWorldAncestors(mergedWorld, parentObject);
		attachFeatureRegistry(mergedWorld, featureRegistry);
		attachContainer(mergedWorld, container);
		attachRuntime(mergedWorld);
		container.registerValue(WORLD_TOKEN, mergedWorld, {
			scope: Scope.SCENARIO,
		});

		if (appFactory) {
			const resolvedAppFactory = appFactory as AppFactory<World, unknown>;
			const composer = createAppFactoryContext(container, mergedWorld as World);
			const appResult = await resolvedAppFactory(composer);
			const app = appResult ?? composer.getRegisteredApp();
			if (app === undefined) {
				throw new Error(
					"App factory did not return an application instance. Use return or registerApp to provide one."
				);
			}
			(mergedWorld as Record<string, unknown>).app = app as unknown;
		}

		return mergedWorld as World;
	};
}

function attachStepsHelpers<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap,
	Facets extends Record<string, unknown>
>(
	state: BuilderState,
	environment: RunnerEnvironment<World, ExpressionTypes>,
	globals: GlobalRunner<World, ExpressionTypes>,
	ensureFactory: RunnerEnsureFactory<World, Facets>
): RunnerStepsSurface<World, ExpressionTypes, Facets> {
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
	if (!("ensure" in environment)) {
		Object.defineProperty(environment, "ensure", {
			value: ensureFactory,
			enumerable: true,
			configurable: true,
		});
	}
	return environment as RunnerStepsSurface<World, ExpressionTypes, Facets>;
}

function resolveEnsureFactory<
	World,
	Facets extends Record<string, unknown>
>(state: BuilderState): RunnerEnsureFactory<World, Facets> {
	if (state.ensureFactory) {
		return state.ensureFactory as RunnerEnsureFactory<World, Facets>;
	}
	const factory = createDefaultEnsureFactory<World>();
	const proxy = createImplicitEnsureProxy(factory);
	state.ensureFactory = proxy as RunnerEnsureFactory<
		unknown,
		Record<string, unknown>
	>;
	return proxy as RunnerEnsureFactory<World, Facets>;
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

function createAppFactoryContext<World>(
	container: IContainer,
	world: World
): AppFactoryContext<World> & { getRegisteredApp(): unknown } {
	let registeredApp: unknown;

	const context: AppFactoryContext<World> = {
		container,
		world,
		registerClass(target, options) {
			const { scope, tags, deps, inject } = options ?? {};
			let propsMap: RegistrationOptions["props"] | undefined;

			if (inject) {
				const keys = Reflect.ownKeys(inject);
				if (keys.length > 0) {
					const entries: Array<readonly [PropertyKey, AppPropertyInjection]> = [];
					for (const key of keys) {
					const descriptor = inject[key as PropertyKey];
					if (!descriptor) {
						continue;
					}
					entries.push([key, descriptor]);
				}
					if (entries.length > 0) {
						propsMap = Object.fromEntries(entries.map(([key, descriptor]) => {
						if (typeof descriptor === "object" && "token" in descriptor) {
							return [key, {
								token: descriptor.token,
								...(descriptor.lazy ? { lazy: descriptor.lazy } : {}),
							}];
						}
						return [key, descriptor as Identifier];
						})) as RegistrationOptions["props"];
					}
				}
			}

			const registration: RegistrationOptions = {
				...(scope ? { scope } : {}),
				...(tags ? { tags: [...tags] } : {}),
				...(deps ? { deps: [...deps] } : {}),
				...(propsMap ? { props: propsMap } : {}),
			};

			container.registerClass(target, registration);
			return context;
		},
		registerValue(identifier, value, options) {
			container.registerValue(identifier, value, options);
			return context;
		},
		registerFactory(identifier, factory, options) {
			container.registerFactory(identifier, factory, options);
			return context;
		},
		registerToken(token, target, options) {
			container.registerToken(token, target, options);
			return context;
		},
		async registerApp(target, options) {
			context.registerClass(target, options);
			const instance = container.resolve(target);
			registeredApp = instance;
			if (options?.configure) {
				await options.configure(instance, context);
			}
			return instance;
		},
		resolve(identifier) {
			return container.resolve(identifier);
		},
	};

	return Object.assign(context, {
		getRegisteredApp: () => registeredApp,
	});
}

function attachRuntime(world: Record<string, unknown>): void {
	if (Reflect.has(world, "runtime")) {
		return;
	}
	Object.defineProperty(world, "runtime", {
		get() {
			return createStepRuntime(this);
		},
		enumerable: false,
		configurable: true,
	});
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

const PARENT_WORLD_EXCLUDE_KEYS: ReadonlySet<PropertyKey> = new Set([
	"di",
	"container",
	"runtime",
	"app",
	"ancestors",
]);

function mergeWorldWithParent(
	child: Record<string, unknown>,
	parent: Record<string, unknown> | undefined,
	inheritance: WorldInheritanceMetadata | undefined
): Record<string, unknown> {
	if (!parent || !inheritance || inheritance.size === 0) {
		return child;
	}

	for (const key of inheritance) {
		if (PARENT_WORLD_EXCLUDE_KEYS.has(key)) {
			continue;
		}
		if (!Reflect.has(parent, key)) {
			continue;
		}
		const descriptor = Object.getOwnPropertyDescriptor(parent, key);
		if (descriptor) {
			Object.defineProperty(child, key, descriptor);
		}
	}

	return child;
}

function attachWorldAncestors(
	world: Record<string, unknown>,
	parent: Record<string, unknown> | undefined
): void {
	const parentAncestors =
		parent && Reflect.has(parent, "ancestors")
			? (parent as Record<string, unknown> & {
					ancestors?: readonly unknown[];
				}).ancestors
			: undefined;
	const lineage = parent
		? [
			parent,
			...(Array.isArray(parentAncestors) ? parentAncestors : []),
		]
		: [];

	Object.defineProperty(world, "ancestors", {
		value: lineage,
		writable: false,
		enumerable: false,
		configurable: true,
	});
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

function createImplicitEnsureProxy<World, Facets extends Record<string, unknown>>(
	factory: EnsureFactory<World, Facets>
): RunnerEnsureFactory<World, Facets> {
	return new Proxy(factory, {
		get(target, prop, receiver) {
			if (prop === "world") {
				return tryGetWorld<World>();
			}
			const world = tryGetWorld<World>();
			if (world) {
				const facade = factory(world);
				return Reflect.get(facade, prop, receiver);
			}
			return Reflect.get(target, prop, receiver);
		},
		apply(target, _thisArg, args) {
			const [arg, options] = args;
			const world = tryGetWorld<World>();
			if (world) {
				if (arg === world) {
					return factory(world);
				}
				const facade = factory(world);
				return facade(arg, options as EnsureOptions);
			}
			return factory(arg as World);
		},
	}) as unknown as RunnerEnsureFactory<World, Facets>;
}
