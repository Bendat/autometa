import { createRunner, type RunnerEnvironment } from "./create-runner";
import type { RunnerContextOptions } from "../core/runner-context";
import type {
	CucumberExpressionTypeMap,
	DefaultCucumberExpressionTypes,
} from "@autometa/scopes";

export interface GlobalRunner<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
> extends RunnerEnvironment<World, ExpressionTypes> {
	reset(
		options?: RunnerContextOptions<World>
	): RunnerEnvironment<World, ExpressionTypes>;
	useEnvironment(
		environment: RunnerEnvironment<World, ExpressionTypes>
	): RunnerEnvironment<World, ExpressionTypes>;
	getEnvironment(): RunnerEnvironment<World, ExpressionTypes>;
}

export function createGlobalRunner<
	World,
	ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
>(
	initialOptions?: RunnerContextOptions<World>
): GlobalRunner<World, ExpressionTypes> {
	let lastOptions = initialOptions;

	function instantiate(
		options?: RunnerContextOptions<World>
	): RunnerEnvironment<World, ExpressionTypes> {
		if (options) {
			lastOptions = options;
			return createRunner<World, ExpressionTypes>(options);
		}

		if (lastOptions) {
			return createRunner<World, ExpressionTypes>(lastOptions);
		}

		return createRunner<World, ExpressionTypes>();
	}

	let current = instantiate(initialOptions);

	const target = {
		reset(options?: RunnerContextOptions<World>) {
			current = instantiate(options);
			return current;
		},
		useEnvironment(environment: RunnerEnvironment<World, ExpressionTypes>) {
			current = environment;
			return current;
		},
		getEnvironment() {
			return current;
		},
	};

	const forwardedKeys = new Set<PropertyKey>([
		"reset",
		"useEnvironment",
		"getEnvironment",
	]);

	return new Proxy(target as GlobalRunner<World, ExpressionTypes>, {
		get(obj, prop, receiver) {
			if (forwardedKeys.has(prop)) {
				return Reflect.get(obj, prop, receiver);
			}

			const value = current[
				prop as keyof RunnerEnvironment<World, ExpressionTypes>
			];
			if (typeof value === "function") {
				return (value as (...args: unknown[]) => unknown).bind(current);
			}
			return value;
		},
		has(_, prop) {
			if (forwardedKeys.has(prop)) {
				return true;
			}
			return prop in current;
		},
		ownKeys() {
			const forwardable = Array.from(forwardedKeys).filter(
				(key): key is string | symbol =>
					typeof key === "string" || typeof key === "symbol"
			);
			const keys = new Set<string | symbol>([
				...Reflect.ownKeys(current),
				...forwardable,
			]);
			return Array.from(keys);
		},
		getOwnPropertyDescriptor(obj, prop) {
			if (forwardedKeys.has(prop)) {
				return {
					configurable: true,
					enumerable: false,
					value: Reflect.get(obj, prop),
				};
			}
			return Object.getOwnPropertyDescriptor(current, prop);
		},
	}) as GlobalRunner<World, ExpressionTypes>;
}
