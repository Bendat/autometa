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
	readonly adapterFactory?: CoordinateFeatureOptions<World>["adapterFactory"];
	readonly planBuilder?: CoordinateFeatureOptions<World>["planBuilder"];
	readonly registerPlan?: CoordinateFeatureOptions<World>["registerPlan"];
	readonly featureScope?: BuildTestPlanOptions<World>["featureScope"];
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
	});
}
