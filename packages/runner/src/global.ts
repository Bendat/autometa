import type { RunnerEnvironment } from "./dsl/create-runner";
import type { RunnerContextOptions } from "./core/runner-context";
import {
	createGlobalRunner,
	type GlobalRunner,
} from "./dsl/create-global-runner";

export interface GlobalWorld {
	[key: string]: unknown;
}

export type GlobalRunnerOptions = RunnerContextOptions<GlobalWorld>;

let runnerInstance: GlobalRunner<GlobalWorld> | undefined;

function instantiateRunner(options?: GlobalRunnerOptions): GlobalRunner<GlobalWorld> {
	return createGlobalRunner<GlobalWorld>(options);
}

function requireConfigured(action: string): GlobalRunner<GlobalWorld> {
	if (!runnerInstance) {
		throw new Error(
			`Global runner has not been configured. ${action}`
		);
	}
	return runnerInstance;
}
export function getGlobalRunner(options?: GlobalRunnerOptions): GlobalRunner<GlobalWorld> {
	if (!runnerInstance) {
		runnerInstance = instantiateRunner(options);
	}
	return runnerInstance;
}

export function configureGlobalRunner(options?: GlobalRunnerOptions): GlobalRunner<GlobalWorld> {
	runnerInstance = instantiateRunner(options);
	return runnerInstance;
}

export function resetGlobalRunner(options?: GlobalRunnerOptions): GlobalRunner<GlobalWorld> {
	runnerInstance = instantiateRunner(options);
	return runnerInstance;
}

export function disposeGlobalRunner() {
	runnerInstance = undefined;
}

export function useGlobalRunnerEnvironment(
	environment: RunnerEnvironment<GlobalWorld>
): RunnerEnvironment<GlobalWorld> {
	const runner = requireConfigured(
		"Call configureGlobalRunner() before injecting environments."
	);
	return runner.useEnvironment(environment);
}

export function getGlobalRunnerEnvironment(): RunnerEnvironment<GlobalWorld> {
	const runner = requireConfigured(
		"Call configureGlobalRunner() before reading environments."
	);
	return runner.getEnvironment();
}

export function getConfiguredGlobalRunner(): GlobalRunner<GlobalWorld> {
	return requireConfigured(
		"Call configureGlobalRunner() before accessing runner APIs."
	);
}
