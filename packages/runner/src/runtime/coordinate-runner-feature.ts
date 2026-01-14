import type { ExecutorConfig } from "@autometa/config";
import type {
	CoordinateFeatureOptions,
	CoordinateFeatureResult,
} from "@autometa/coordinator";
import { coordinateFeature } from "@autometa/coordinator";
import type { ExecutorRuntime } from "@autometa/executor";
import type { BuildTestPlanOptions } from "@autometa/test-builder";
import type { SimpleFeature } from "@autometa/gherkin";
import type { ScopePlan } from "@autometa/scopes";

import type { RunnerEnvironment } from "../dsl/create-runner";

export interface CoordinateRunnerFeatureOptions<World> {
	readonly environment: RunnerEnvironment<World>;
	readonly plan?: ScopePlan<World>;
	readonly feature: SimpleFeature;
	readonly config: ExecutorConfig;
	readonly runtime?: ExecutorRuntime;
	readonly adapterFactory?:
		| CoordinateFeatureOptions<World>["adapterFactory"]
		| undefined;
	readonly planBuilder?:
		| CoordinateFeatureOptions<World>["planBuilder"]
		| undefined;
	readonly registerPlan?:
		| CoordinateFeatureOptions<World>["registerPlan"]
		| undefined;
	readonly featureScope?:
		| BuildTestPlanOptions<World>["featureScope"]
		| undefined;
	readonly hookLogger?: CoordinateFeatureOptions<World>["hookLogger"];
}

export function coordinateRunnerFeature<World>(
	options: CoordinateRunnerFeatureOptions<World>
): CoordinateFeatureResult<World> {
	const {
		environment,
		feature,
		config,
		runtime,
		plan,
		adapterFactory,
		planBuilder,
		registerPlan,
		featureScope,
		hookLogger,
	} = options;

	const scopePlan = plan ?? environment.getPlan();

	return coordinateFeature<World>({
		feature,
		scopePlan,
		config,
		...(runtime ? { runtime } : {}),
		...(adapterFactory ? { adapterFactory } : {}),
		...(planBuilder ? { planBuilder } : {}),
		...(registerPlan ? { registerPlan } : {}),
		...(featureScope ? { featureScope } : {}),
		...(hookLogger ? { hookLogger } : {}),
	});
}
