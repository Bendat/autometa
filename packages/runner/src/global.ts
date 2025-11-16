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

function instantiateRunner(options?: GlobalRunnerOptions) {
	return createGlobalRunner<GlobalWorld>(options);
}

function assertConfigured(action: string): asserts runnerInstance is GlobalRunner<GlobalWorld> {
	if (!runnerInstance) {
		throw new Error(
			`Global runner has not been configured. ${action}`
		);
	}
}

export function getGlobalRunner(options?: GlobalRunnerOptions) {
	if (!runnerInstance) {
		runnerInstance = instantiateRunner(options);
	}
	return runnerInstance;
}

export function configureGlobalRunner(options?: GlobalRunnerOptions) {
	runnerInstance = instantiateRunner(options);
	return runnerInstance;
}

export function resetGlobalRunner(options?: GlobalRunnerOptions) {
	runnerInstance = instantiateRunner(options);
	return runnerInstance;
}

export function disposeGlobalRunner() {
	runnerInstance = undefined;
}

export function useGlobalRunnerEnvironment(
	environment: RunnerEnvironment<GlobalWorld>
) {
	assertConfigured("Call configureGlobalRunner() before injecting environments.");
	return runnerInstance!.useEnvironment(environment);
}

export function getGlobalRunnerEnvironment() {
	assertConfigured("Call configureGlobalRunner() before reading environments.");
	return runnerInstance!.getEnvironment();
}

export function getConfiguredGlobalRunner() {
	assertConfigured("Call configureGlobalRunner() before accessing runner APIs.");
	return runnerInstance!;
}
