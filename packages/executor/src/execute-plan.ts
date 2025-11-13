import type { ExecutorConfig } from "@autometa/config";
import type { ScopeExecutionAdapter } from "@autometa/scopes";
import type {
  RuleNode,
  ScenarioExecution,
  ScenarioNode,
  ScenarioOutlineNode,
  TestPlan,
} from "@autometa/test-builder";

import { createTagFilter } from "./tag-filter";
import { selectSuiteByMode, selectTestByMode } from "./modes";
import { resolveTimeout } from "./timeouts";
import { runScenarioExecution } from "./scenario-runner";
import type { ExecutorRuntime } from "./types";

export interface ExecuteFeatureOptions<World> {
  readonly plan: TestPlan<World>;
  readonly adapter: ScopeExecutionAdapter<World>;
  readonly runtime: ExecutorRuntime;
  readonly config: ExecutorConfig;
}

export function registerFeaturePlan<World>(options: ExecuteFeatureOptions<World>): void {
  const { plan, runtime, adapter, config } = options;
  const feature = plan.feature;
  const tagFilter = createTagFilter(config.test?.tagFilter);

  const featureTimeout = resolveTimeout(feature.scope.timeout, config);
  const featureSuite = selectSuiteByMode(runtime.suite, feature.scope.mode);

  featureSuite(feature.name, () => {
    registerScenarios(feature.scenarios, runtime, adapter, config, tagFilter);
    registerScenarioOutlines(feature.scenarioOutlines, runtime, adapter, config, tagFilter);
    registerRules(feature.rules, runtime, adapter, config, tagFilter);
  }, featureTimeout.milliseconds);
}

function registerRules<World>(
  rules: readonly RuleNode<World>[],
  runtime: ExecutorRuntime,
  adapter: ScopeExecutionAdapter<World>,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>
): void {
  for (const rule of rules) {
    const suite = selectSuiteByMode(runtime.suite, rule.scope.mode);
    const timeout = resolveTimeout(rule.scope.timeout, config);
    suite(rule.name, () => {
      registerScenarios(rule.scenarios, runtime, adapter, config, tagFilter);
      registerScenarioOutlines(rule.scenarioOutlines, runtime, adapter, config, tagFilter);
    }, timeout.milliseconds);
  }
}

function registerScenarioOutlines<World>(
  outlines: readonly ScenarioOutlineNode<World>[],
  runtime: ExecutorRuntime,
  adapter: ScopeExecutionAdapter<World>,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>
): void {
  for (const outline of outlines) {
    const suite = selectSuiteByMode(runtime.suite, outline.mode);
    const timeout = resolveTimeout(outline.timeout, config);
    suite(outline.name, () => {
      registerScenarioExecutions(outline.examples, runtime, adapter, config, tagFilter);
    }, timeout.milliseconds);
  }
}

function registerScenarios<World>(
  scenarios: readonly ScenarioNode<World>[],
  runtime: ExecutorRuntime,
  adapter: ScopeExecutionAdapter<World>,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>
): void {
  registerScenarioExecutions(scenarios, runtime, adapter, config, tagFilter);
}

function registerScenarioExecutions<World>(
  executions: readonly ScenarioExecution<World>[],
  runtime: ExecutorRuntime,
  adapter: ScopeExecutionAdapter<World>,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>
): void {
  for (const execution of executions) {
    scheduleScenario(execution, runtime, adapter, config, tagFilter);
  }
}

function scheduleScenario<World>(
  execution: ScenarioExecution<World>,
  runtime: ExecutorRuntime,
  adapter: ScopeExecutionAdapter<World>,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>
): void {
  if (!tagFilter.evaluate(execution.tags)) {
    runtime.test.skip(execution.name, () => undefined);
    return;
  }

  const testFn = selectTestByMode(runtime.test, execution.mode);
  const scenarioTimeout = resolveTimeout(execution.timeout, config);

  testFn(execution.name, async () => {
    await runScenarioExecution(execution, { adapter });
  }, scenarioTimeout.milliseconds);
}
