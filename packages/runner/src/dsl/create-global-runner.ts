import { createRunner, type RunnerEnvironment } from "./create-runner";
import type { RunnerContextOptions } from "../core/runner-context";

export interface GlobalRunner<World> extends RunnerEnvironment<World> {
	reset(options?: RunnerContextOptions<World>): RunnerEnvironment<World>;
	useEnvironment(environment: RunnerEnvironment<World>): RunnerEnvironment<World>;
	getEnvironment(): RunnerEnvironment<World>;
}

export function createGlobalRunner<World>(
	initialOptions?: RunnerContextOptions<World>
): GlobalRunner<World> {
	let lastOptions = initialOptions;

	function instantiate(
		options?: RunnerContextOptions<World>
	): RunnerEnvironment<World> {
		if (options) {
			lastOptions = options;
			return createRunner<World>(options);
		}

		if (lastOptions) {
			return createRunner<World>(lastOptions);
		}

		return createRunner<World>();
	}

	let current = instantiate(initialOptions);

	const target = {
		reset(options?: RunnerContextOptions<World>) {
			current = instantiate(options);
			return current;
		},
		useEnvironment(environment: RunnerEnvironment<World>) {
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

	return new Proxy(target as GlobalRunner<World>, {
		get(obj, prop, receiver) {
			if (forwardedKeys.has(prop)) {
				return Reflect.get(obj, prop, receiver);
			}

			const value = current[prop as keyof RunnerEnvironment<World>];
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
	}) as GlobalRunner<World>;
}
