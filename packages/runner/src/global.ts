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

const runnerInstance = createGlobalRunner<GlobalWorld>();

export const globalRunner: GlobalRunner<GlobalWorld> = runnerInstance;

export function configureGlobalRunner(options?: GlobalRunnerOptions) {
	return runnerInstance.reset(options);
}

export function useGlobalRunnerEnvironment(
	environment: RunnerEnvironment<GlobalWorld>
) {
	return runnerInstance.useEnvironment(environment);
}

export function getGlobalRunnerEnvironment() {
	return runnerInstance.getEnvironment();
}

function wrapMethod<K extends keyof RunnerEnvironment<GlobalWorld>>(
	key: K
) {
	return ((...args: unknown[]) => {
		const method = runnerInstance[key];
		if (typeof method !== "function") {
			throw new TypeError(`Global runner property ${String(key)} is not callable`);
		}
		return (method as (...innerArgs: unknown[]) => unknown)(...args);
	}) as RunnerEnvironment<GlobalWorld>[K];
}

export const defineParameterType = wrapMethod("defineParameterType");
export const defineParameterTypes = wrapMethod("defineParameterTypes");
export const defineParameterTypesFromList = wrapMethod(
	"defineParameterTypesFromList"
);
export const registerDefaultParameterTypes = wrapMethod(
	"registerDefaultParameterTypes"
);
export const lookupParameterType = wrapMethod("lookupParameterType");

export const feature = wrapMethod("feature");
export const rule = wrapMethod("rule");
export const scenario = wrapMethod("scenario");
export const scenarioOutline = wrapMethod("scenarioOutline");
export const plan = wrapMethod("plan");
export const getPlan = wrapMethod("getPlan");

export const Feature = wrapMethod("feature");
export const Rule = wrapMethod("rule");
export const Scenario = wrapMethod("scenario");
export const ScenarioOutline = wrapMethod("scenarioOutline");

export const given = wrapMethod("given");
export const when = wrapMethod("when");
export const then = wrapMethod("then");
export const and = wrapMethod("and");
export const but = wrapMethod("but");

export const Given = wrapMethod("Given");
export const When = wrapMethod("When");
export const Then = wrapMethod("Then");
export const And = wrapMethod("And");
export const But = wrapMethod("But");

export const beforeFeature = wrapMethod("beforeFeature");
export const afterFeature = wrapMethod("afterFeature");
export const beforeRule = wrapMethod("beforeRule");
export const afterRule = wrapMethod("afterRule");
export const beforeScenario = wrapMethod("beforeScenario");
export const afterScenario = wrapMethod("afterScenario");
export const beforeScenarioOutline = wrapMethod("beforeScenarioOutline");
export const afterScenarioOutline = wrapMethod("afterScenarioOutline");
export const beforeStep = wrapMethod("beforeStep");
export const afterStep = wrapMethod("afterStep");

export const BeforeFeature = wrapMethod("BeforeFeature");
export const AfterFeature = wrapMethod("AfterFeature");
export const BeforeRule = wrapMethod("BeforeRule");
export const AfterRule = wrapMethod("AfterRule");
export const BeforeScenario = wrapMethod("BeforeScenario");
export const AfterScenario = wrapMethod("AfterScenario");
export const BeforeScenarioOutline = wrapMethod("BeforeScenarioOutline");
export const AfterScenarioOutline = wrapMethod("AfterScenarioOutline");
export const BeforeStep = wrapMethod("BeforeStep");
export const AfterStep = wrapMethod("AfterStep");
