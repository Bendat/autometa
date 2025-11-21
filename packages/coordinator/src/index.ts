import type { ExecutorConfig } from "@autometa/config";
import { AutomationError } from "@autometa/errors";
import type { ExecuteFeatureOptions, ExecutorRuntime } from "@autometa/executor";
import { registerFeaturePlan, type HookLogListener } from "@autometa/executor";
import type {
	ScopeExecutionAdapter,
	ScopePlan,
} from "@autometa/scopes";
import { createExecutionAdapter } from "@autometa/scopes";
import type { SimpleFeature } from "@autometa/gherkin";
import { buildTestPlan } from "@autometa/test-builder";
import type {
	BuildTestPlanOptions,
	TestPlan,
} from "@autometa/test-builder";

type AdapterFactory<World> = (plan: ScopePlan<World>) => ScopeExecutionAdapter<World>;
type PlanBuilder<World> = (options: BuildTestPlanOptions<World>) => TestPlan<World>;
type RegistrationHandler<World> = (options: ExecuteFeatureOptions<World>) => void;

export interface CoordinateFeatureOptions<World> {
	readonly feature: SimpleFeature;
	readonly scopePlan: ScopePlan<World>;
	readonly config: ExecutorConfig;
	readonly runtime?: ExecutorRuntime;
	readonly planBuilder?: PlanBuilder<World>;
	readonly adapterFactory?: AdapterFactory<World>;
	readonly registerPlan?: RegistrationHandler<World>;
	readonly featureScope?: BuildTestPlanOptions<World>["featureScope"];
	readonly hookLogger?: HookLogListener;
}

export interface CoordinateFeatureResult<World> {
	readonly feature: SimpleFeature;
	readonly adapter: ScopeExecutionAdapter<World>;
	readonly plan: TestPlan<World>;
	readonly config: ExecutorConfig;
	register(runtime?: ExecutorRuntime): void;
}

export function coordinateFeature<World>(
	options: CoordinateFeatureOptions<World>
): CoordinateFeatureResult<World> {
	const { feature, scopePlan, config } = options;

	assertFeature(feature);
	assertScopePlan(scopePlan);
	assertConfig(config);

	const createAdapter = options.adapterFactory ?? defaultAdapterFactory;
	const buildPlan = options.planBuilder ?? defaultPlanBuilder;
	const register = options.registerPlan ?? defaultRegistrationHandler;

	const adapter = createAdapter(scopePlan);
	const planOptions: BuildTestPlanOptions<World> = {
		feature,
		adapter,
		...(options.featureScope !== undefined
			? { featureScope: options.featureScope }
			: {}),
	};

	const plan = buildPlan(planOptions);

	return {
		feature,
		adapter,
		plan,
		config,
		register(runtime) {
			const executorRuntime = runtime ?? options.runtime;
			if (!executorRuntime) {
				throw new AutomationError(
					"An executor runtime is required to register the feature plan"
				);
			}
			register({
				plan,
				adapter,
				runtime: executorRuntime,
				config,
				...(options.hookLogger ? { hookLogger: options.hookLogger } : {}),
			});
		},
	};
}

function defaultAdapterFactory<World>(plan: ScopePlan<World>): ScopeExecutionAdapter<World> {
	return createExecutionAdapter(plan);
}

function defaultPlanBuilder<World>(options: BuildTestPlanOptions<World>): TestPlan<World> {
	return buildTestPlan(options);
}

function defaultRegistrationHandler<World>(options: ExecuteFeatureOptions<World>): void {
	registerFeaturePlan(options);
}

function assertFeature(feature: SimpleFeature | undefined): asserts feature is SimpleFeature {
	if (!feature) {
		throw new AutomationError("A Gherkin feature is required to coordinate execution");
	}
}

function assertScopePlan<World>(plan: ScopePlan<World> | undefined): asserts plan is ScopePlan<World> {
	if (!plan) {
		throw new AutomationError("A scope plan is required to coordinate execution");
	}
	if (!plan.root || plan.root.children.length === 0) {
		throw new AutomationError("The provided scope plan does not contain any feature scopes");
	}
}

function assertConfig(config: ExecutorConfig | undefined): asserts config is ExecutorConfig {
	if (!config) {
		throw new AutomationError("An executor configuration is required to coordinate execution");
	}
}

export default {
	coordinateFeature,
};