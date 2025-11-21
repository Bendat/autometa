import type { ExecutorConfig } from "@autometa/config";
import type { ScopeExecutionAdapter } from "@autometa/scopes";
import type {
  RuleNode,
  ScenarioExecution,
  ScenarioNode,
  ScenarioOutlineNode,
  ScenarioOutlineExample,
  TestPlan,
} from "@autometa/test-builder";

import { createTagFilter } from "./tag-filter";
import { resolveModeFromTags, selectSuiteByMode, selectTestByMode } from "./modes";
import { resolveTimeout } from "./timeouts";
import { runScenarioExecution } from "./scenario-runner";
import { ScopeLifecycle, type HookLogListener } from "./scope-lifecycle";
import type { ExecutorRuntime, SuiteFn } from "./types";

export interface ExecuteFeatureOptions<World> {
  readonly plan: TestPlan<World>;
  readonly adapter: ScopeExecutionAdapter<World>;
  readonly runtime: ExecutorRuntime;
  readonly config: ExecutorConfig;
  readonly hookLogger?: HookLogListener;
}

type SuiteMetadata = {
  readonly kind?: "feature" | "rule" | "scenarioOutline" | "examples";
  readonly keyword?: string;
};

type SuiteFnWithMetadata = SuiteFn & {
  __withMetadata?: (metadata: SuiteMetadata | undefined, register: () => void) => void;
};

type ScenarioOutlineExampleGroup<World> = {
  readonly group: ScenarioOutlineExample<World>["exampleGroup"];
  readonly examples: ScenarioOutlineExample<World>[];
};

type OutlineExampleCollection<World> = {
  readonly outline: ScenarioOutlineNode<World>;
  readonly order: string[];
  readonly groups: Map<string, ScenarioOutlineExampleGroup<World>>;
};

function runSuiteWithMetadata(
  suite: SuiteFn,
  metadata: SuiteMetadata,
  title: string,
  handler: () => void,
  timeout?: number
): void {
  const target = suite as SuiteFnWithMetadata;
  if (typeof target.__withMetadata === "function") {
    target.__withMetadata(metadata, () => {
      suite(title, handler, timeout);
    });
    return;
  }
  suite(title, handler, timeout);
}

function isScenarioOutlineExample<World>(
  execution: ScenarioExecution<World>
): execution is ScenarioOutlineExample<World> {
  return execution.type === "example";
}

function shouldDisplayExamplesGroup(group: ScenarioOutlineExample<unknown>["exampleGroup"], totalGroups: number): boolean {
  if (totalGroups > 1) {
    return true;
  }

  const name = group.name?.trim();
  return Boolean(name && name.length > 0);
}

function formatExamplesGroupTitle(
  group: ScenarioOutlineExample<unknown>["exampleGroup"],
  index: number
): string {
  const trimmed = group.name?.trim();
  if (trimmed && trimmed.length > 0) {
    return trimmed;
  }
  return `Table #${index + 1}`;
}

export function registerFeaturePlan<World>(options: ExecuteFeatureOptions<World>): void {
  const { plan, runtime, adapter, config, hookLogger } = options;
  const feature = plan.feature;
  const tagFilter = createTagFilter(config.test?.tagFilter);
  const scopeKeywords = collectScopeKeywords(feature);
  const lifecycle = new ScopeLifecycle(adapter, {
    ...(hookLogger ? { hookLogger } : {}),
    featureLanguage: feature.feature.language,
    scopeKeywords,
  });

  const featureTags = [
    ...(feature.feature.tags ?? []),
    ...(feature.scope.tags ?? []),
  ];
  const featureMode = resolveModeFromTags(feature.scope.mode, featureTags);
  const featureTimeout = resolveTimeout(feature.scope.timeout, config);
  const featureSuite = selectSuiteByMode(runtime.suite, featureMode);

  runSuiteWithMetadata(
    featureSuite,
    { kind: "feature", keyword: feature.keyword },
    feature.name,
    () => {
      lifecycle.configurePersistentScope(feature.scope, runtime);
      registerScenarios(feature.scenarios, runtime, config, tagFilter, lifecycle);
      registerScenarioOutlines(feature.scenarioOutlines, runtime, config, tagFilter, lifecycle);
      registerRules(feature.rules, runtime, config, tagFilter, lifecycle);
    },
    featureTimeout.milliseconds
  );
}

function collectScopeKeywords<World>(feature: TestPlan<World>["feature"]): ReadonlyMap<string, string> {
  const entries: Array<[string, string]> = [];

  entries.push([feature.scope.id, feature.keyword]);

  for (const scenario of feature.scenarios) {
    entries.push([scenario.scope.id, scenario.keyword]);
  }

  for (const outline of feature.scenarioOutlines) {
    entries.push([outline.scope.id, outline.keyword]);
    for (const example of outline.examples) {
      entries.push([example.scope.id, example.keyword]);
    }
  }

  for (const rule of feature.rules) {
    entries.push([rule.scope.id, rule.keyword]);
    for (const scenario of rule.scenarios) {
      entries.push([scenario.scope.id, scenario.keyword]);
    }
    for (const outline of rule.scenarioOutlines) {
      entries.push([outline.scope.id, outline.keyword]);
      for (const example of outline.examples) {
        entries.push([example.scope.id, example.keyword]);
      }
    }
  }

  return new Map(entries);
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
    runSuiteWithMetadata(
      suite,
      { kind: "rule", keyword: rule.keyword },
      rule.name,
      () => {
        lifecycle.configurePersistentScope(rule.scope, runtime);
        registerScenarios(rule.scenarios, runtime, config, tagFilter, lifecycle);
        registerScenarioOutlines(rule.scenarioOutlines, runtime, config, tagFilter, lifecycle);
      },
      timeout.milliseconds
    );
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
    runSuiteWithMetadata(
      suite,
      { kind: "scenarioOutline", keyword: outline.keyword },
      outline.name,
      () => {
        lifecycle.configurePersistentScope(outline.scope, runtime);
        registerScenarioExecutions(outline.examples, runtime, config, tagFilter, lifecycle);
      },
      timeout.milliseconds
    );
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
  const standaloneExecutions: ScenarioExecution<World>[] = [];
  const outlineExamples = new Map<string, OutlineExampleCollection<World>>();

  for (const execution of executions) {
    if (isScenarioOutlineExample(execution)) {
      const outlineId = execution.outline.scope.id;
      let collection = outlineExamples.get(outlineId);
      if (!collection) {
        collection = {
          outline: execution.outline,
          order: [],
          groups: new Map(),
        } satisfies OutlineExampleCollection<World>;
        outlineExamples.set(outlineId, collection);
      }

      const groupId = execution.exampleGroup.id;
      let groupInfo = collection.groups.get(groupId);
      if (!groupInfo) {
        groupInfo = {
          group: execution.exampleGroup,
          examples: [],
        } satisfies ScenarioOutlineExampleGroup<World>;
        collection.groups.set(groupId, groupInfo);
        collection.order.push(groupId);
      }

      groupInfo.examples.push(execution);
      continue;
    }

    standaloneExecutions.push(execution);
  }

  for (const execution of standaloneExecutions) {
    scheduleScenario(execution, runtime, config, tagFilter, lifecycle);
  }

  for (const collection of outlineExamples.values()) {
    const orderedGroups = collection.order
      .map((id) => collection.groups.get(id))
      .filter((info): info is ScenarioOutlineExampleGroup<World> => Boolean(info));

    if (orderedGroups.length === 0) {
      continue;
    }

      if (orderedGroups.length === 1) {
        const [singleGroup] = orderedGroups;
        if (singleGroup && !shouldDisplayExamplesGroup(singleGroup.group, orderedGroups.length)) {
          for (const example of singleGroup.examples) {
            scheduleScenario(example, runtime, config, tagFilter, lifecycle);
          }
          continue;
        }
      }

    orderedGroups.forEach((info, index) => {
      const title = formatExamplesGroupTitle(info.group, index);
      const keyword = (info.group.keyword ?? "Examples").trim() || "Examples";
      runSuiteWithMetadata(
        runtime.suite,
        { kind: "examples", keyword },
        title,
        () => {
          for (const example of info.examples) {
            scheduleScenario(example, runtime, config, tagFilter, lifecycle);
          }
        }
      );
    });
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
