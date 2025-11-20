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
import { resolveModeFromTags, selectSuiteByMode, selectTestByMode } from "./modes";
import { resolveTimeout } from "./timeouts";
import { runScenarioExecution } from "./scenario-runner";
import { ScopeLifecycle } from "./scope-lifecycle";
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
  const lifecycle = new ScopeLifecycle(adapter);

  const featureTags = [
    ...(feature.feature.tags ?? []),
    ...(feature.scope.tags ?? []),
  ];
  const featureMode = resolveModeFromTags(feature.scope.mode, featureTags);
  const featureTimeout = resolveTimeout(feature.scope.timeout, config);
  const featureSuite = selectSuiteByMode(runtime.suite, featureMode);

  featureSuite(feature.name, () => {
    lifecycle.configurePersistentScope(feature.scope, runtime);
    registerScenarios(feature.scenarios, runtime, config, tagFilter, lifecycle);
    registerScenarioOutlines(feature.scenarioOutlines, runtime, config, tagFilter, lifecycle);
    registerRules(feature.rules, runtime, config, tagFilter, lifecycle);
  }, featureTimeout.milliseconds);
}

function registerRules<World>(
  rules: readonly RuleNode<World>[],
  runtime: ExecutorRuntime,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>,
  lifecycle: ScopeLifecycle<World>
): void {
  for (const rule of rules) {
    const ruleTags = [
      ...(rule.rule.tags ?? []),
      ...(rule.scope.tags ?? []),
    ];
    const ruleMode = resolveModeFromTags(rule.scope.mode, ruleTags);
    const suite = selectSuiteByMode(runtime.suite, ruleMode);
    const timeout = resolveTimeout(rule.scope.timeout, config);
    suite(rule.name, () => {
      lifecycle.configurePersistentScope(rule.scope, runtime);
      registerScenarios(rule.scenarios, runtime, config, tagFilter, lifecycle);
      registerScenarioOutlines(rule.scenarioOutlines, runtime, config, tagFilter, lifecycle);
    }, timeout.milliseconds);
  }
}

function registerScenarioOutlines<World>(
  outlines: readonly ScenarioOutlineNode<World>[],
  runtime: ExecutorRuntime,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>,
  lifecycle: ScopeLifecycle<World>
): void {
  for (const outline of outlines) {
    const outlineMode = resolveModeFromTags(outline.mode, outline.tags);
    const suite = selectSuiteByMode(runtime.suite, outlineMode);
    const timeout = resolveTimeout(outline.timeout, config);
    suite(outline.name, () => {
      lifecycle.configurePersistentScope(outline.scope, runtime);
      registerScenarioExecutions(outline.examples, runtime, config, tagFilter, lifecycle);
    }, timeout.milliseconds);
  }
}

function registerScenarios<World>(
  scenarios: readonly ScenarioNode<World>[],
  runtime: ExecutorRuntime,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>,
  lifecycle: ScopeLifecycle<World>
): void {
  registerScenarioExecutions(scenarios, runtime, config, tagFilter, lifecycle);
}

function registerScenarioExecutions<World>(
  executions: readonly ScenarioExecution<World>[],
  runtime: ExecutorRuntime,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>,
  lifecycle: ScopeLifecycle<World>
): void {
  for (const execution of executions) {
    scheduleScenario(execution, runtime, config, tagFilter, lifecycle);
  }
}

function scheduleScenario<World>(
  execution: ScenarioExecution<World>,
  runtime: ExecutorRuntime,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>,
  lifecycle: ScopeLifecycle<World>
): void {
  if (!tagFilter.evaluate(execution.tags)) {
    runtime.test.skip(execution.name, () => undefined);
    return;
  }

  if (execution.pending) {
    execution.markPending(execution.pendingReason);
    registerPendingScenarioTest(execution, runtime);
    return;
  }

  const effectiveMode = resolveModeFromTags(execution.mode, execution.tags);
  const testFn = selectTestByMode(runtime.test, effectiveMode);
  const scenarioTimeout = resolveTimeout(execution.timeout, config);

  testFn(execution.name, async () => {
    const hooks = lifecycle.collectScenarioHooks(execution);
    await lifecycle.runScenario(execution, hooks, async (_world, context) => {
      await runScenarioExecution(execution, context);
    });
  }, scenarioTimeout.milliseconds);
}

function registerPendingScenarioTest<World>(
  execution: ScenarioExecution<World>,
  runtime: ExecutorRuntime
): void {
  const reason = execution.pendingReason;
  const { test } = runtime;

  if (typeof test.todo === "function") {
    test.todo(execution.name, reason);
    return;
  }

  if (typeof test.pending === "function") {
    test.pending(execution.name, reason);
    return;
  }

  if (typeof test.skip === "function") {
    test.skip(execution.name, () => undefined);
    return;
  }

  test(execution.name, () => undefined);
}
