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
import { getEventEmitter, TestStatus } from "@autometa/events";
import type { TestStatus as TestStatusValue } from "@autometa/events";
import { isGherkinStepError } from "@autometa/errors";

import { createTagFilter } from "./tag-filter";
import { resolveModeFromTags, selectSuiteByMode, selectTestByMode } from "./modes";
import { resolveTimeout } from "./timeouts";
import { runScenarioExecution } from "./scenario-runner";
import { ScopeLifecycle, type HookLogListener } from "./scope-lifecycle";
import type { ExecutorRuntime, SuiteFn } from "./types";
import { createFeatureRef, createRuleRef, requirePickle } from "./events";

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
  const eventEmitter = getEventEmitter();
  const featureRef = createFeatureRef(feature.feature);
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
      runtime.beforeAll(async () => {
        await eventEmitter.featureStarted({ feature: featureRef });
      });
      runtime.afterAll(async () => {
        await eventEmitter.featureCompleted({ feature: featureRef });
      });
      lifecycle.configurePersistentScope(feature.scope, runtime);
      registerScenarios(feature.scenarios, runtime, config, tagFilter, lifecycle, feature.feature);
      registerScenarioOutlines(feature.scenarioOutlines, runtime, config, tagFilter, lifecycle, feature.feature, featureRef);
      registerRules(feature.rules, runtime, config, tagFilter, lifecycle, feature.feature, featureRef);
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
  lifecycle: ScopeLifecycle<World>,
  feature: TestPlan<World>["feature"]["feature"],
  featureRef: ReturnType<typeof createFeatureRef>
): void {
  const eventEmitter = getEventEmitter();
  for (const rule of rules) {
    const ruleRef = createRuleRef(rule.rule);
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
          runtime.beforeAll(async () => {
            await eventEmitter.ruleStarted({ feature: featureRef, rule: ruleRef });
          });
          runtime.afterAll(async () => {
            await eventEmitter.ruleCompleted({ feature: featureRef, rule: ruleRef });
          });
          lifecycle.configurePersistentScope(rule.scope, runtime);
          registerScenarios(rule.scenarios, runtime, config, tagFilter, lifecycle, feature);
          registerScenarioOutlines(rule.scenarioOutlines, runtime, config, tagFilter, lifecycle, feature, featureRef);
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
  lifecycle: ScopeLifecycle<World>,
  feature: TestPlan<World>["feature"]["feature"],
  featureRef: ReturnType<typeof createFeatureRef>
): void {
  const eventEmitter = getEventEmitter();
  for (const outline of outlines) {
    const outlineMode = resolveModeFromTags(outline.mode, outline.tags);
    const suite = selectSuiteByMode(runtime.suite, outlineMode);
    const timeout = resolveTimeout(outline.timeout, config);
    runSuiteWithMetadata(
      suite,
      { kind: "scenarioOutline", keyword: outline.keyword },
      outline.name,
      () => {
        const firstRule = outline.examples[0]?.rule?.rule;
        runtime.beforeAll(async () => {
          await eventEmitter.scenarioOutlineStarted({
            feature: featureRef,
            scenarioOutline: outline.outline,
            ...(firstRule ? { rule: createRuleRef(firstRule) } : {}),
          });
        });
        runtime.afterAll(async () => {
          await eventEmitter.scenarioOutlineCompleted({
            feature: featureRef,
            scenarioOutline: outline.outline,
            ...(firstRule ? { rule: createRuleRef(firstRule) } : {}),
          });
        });
        lifecycle.configurePersistentScope(outline.scope, runtime);
        registerScenarioExecutions(outline.examples, runtime, config, tagFilter, lifecycle, feature);
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
  lifecycle: ScopeLifecycle<World>,
  feature: TestPlan<World>["feature"]["feature"]
): void {
  registerScenarioExecutions(scenarios, runtime, config, tagFilter, lifecycle, feature);
}

function registerScenarioExecutions<World>(
  executions: readonly ScenarioExecution<World>[],
  runtime: ExecutorRuntime,
  config: ExecutorConfig,
  tagFilter: ReturnType<typeof createTagFilter>,
  lifecycle: ScopeLifecycle<World>,
  feature: TestPlan<World>["feature"]["feature"]
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
    scheduleScenario(execution, runtime, config, tagFilter, lifecycle, feature);
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
            scheduleScenario(example, runtime, config, tagFilter, lifecycle, feature);
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
              scheduleScenario(example, runtime, config, tagFilter, lifecycle, feature);
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
  lifecycle: ScopeLifecycle<World>,
  feature: TestPlan<World>["feature"]["feature"]
): void {
  const title = buildScenarioTitle(execution);
  const eventEmitter = getEventEmitter();

  if (!tagFilter.evaluate(execution.tags)) {
    runtime.test.skip(title, () => undefined);
    return;
  }

  if (execution.pending) {
    execution.markPending(execution.pendingReason);
    registerPendingScenarioTest(execution, runtime, title);
    return;
  }

  const effectiveMode = resolveModeFromTags(execution.mode, execution.tags);
  const testFn = selectTestByMode(runtime.test, effectiveMode);
  const scenarioTimeout = resolveTimeout(execution.timeout, config);

  testFn(title, async () => {
    const hooks = lifecycle.collectScenarioHooks(execution);
    const pickle = requirePickle(feature, execution.gherkin.id);
    const scenarioScope = pickle.scenario;
    const isExample = isScenarioOutlineExample(execution);

    if (isExample) {
      await eventEmitter.exampleStarted({
        feature: pickle.feature,
        scenarioOutline: execution.outline.outline,
        example: execution.exampleGroup,
        pickle,
        ...(pickle.rule ? { rule: pickle.rule } : {}),
      });
    }

    await eventEmitter.scenarioStarted({
      feature: pickle.feature,
      scenario: scenarioScope,
      pickle,
      ...(pickle.rule ? { rule: pickle.rule } : {}),
    });

    let status: TestStatusValue | undefined;
    try {
      await lifecycle.runScenario(
        execution,
        hooks,
        async (_world, context) => {
          await runScenarioExecution(execution, context);
        },
        { events: { pickle } }
      );
      status = execution.result.status === "passed"
        ? TestStatus.PASSED
        : execution.result.status === "failed"
          ? TestStatus.FAILED
          : execution.result.status === "skipped"
            ? TestStatus.SKIPPED
            : execution.result.status === "pending"
              ? TestStatus.SKIPPED
            : undefined;
    } catch (error) {
      status = TestStatus.FAILED;
      if (!isGherkinStepError(error)) {
        await eventEmitter.errorRaised({
          error,
          phase: "scenario",
          feature: pickle.feature,
          scenario: pickle.scenario,
          ...(pickle.rule ? { rule: pickle.rule } : {}),
          pickle,
        });
      }
      throw error;
    } finally {
      if (status) {
        await eventEmitter.statusChanged({
          status,
          feature: pickle.feature,
          scenario: pickle.scenario,
          ...(pickle.rule ? { rule: pickle.rule } : {}),
          pickle,
          metadata: { result: execution.result },
        });
      }

      await eventEmitter.scenarioCompleted({
        feature: pickle.feature,
        scenario: scenarioScope,
        pickle,
        ...(pickle.rule ? { rule: pickle.rule } : {}),
        metadata: { result: execution.result },
      });

      if (isExample) {
        await eventEmitter.exampleCompleted({
          feature: pickle.feature,
          scenarioOutline: execution.outline.outline,
          example: execution.exampleGroup,
          pickle,
          ...(pickle.rule ? { rule: pickle.rule } : {}),
          metadata: { result: execution.result },
        });
      }
    }
  }, scenarioTimeout.milliseconds);
}

function registerPendingScenarioTest<World>(
  execution: ScenarioExecution<World>,
  runtime: ExecutorRuntime,
  title: string
): void {
  const reason = execution.pendingReason;
  const { test } = runtime;

  if (typeof test.todo === "function") {
    test.todo(title, reason);
    return;
  }

  if (typeof test.pending === "function") {
    test.pending(title, reason);
    return;
  }

  if (typeof test.skip === "function") {
    test.skip(title, () => undefined);
    return;
  }

  test(title, () => undefined);
}

function buildScenarioTitle<World>(execution: ScenarioExecution<World>): string {
  if (!isScenarioOutlineExample(execution)) {
    return execution.name;
  }
  const descriptor = formatExampleDescriptor(execution);
  if (!descriptor) {
    return `${execution.name} [Example ${execution.exampleIndex + 1}]`;
  }
  return `${execution.name} [${descriptor}]`;
}

function formatExampleDescriptor<World>(
  example: ScenarioOutlineExample<World>
): string | undefined {
  const segments: string[] = [];
  segments.push(`Example ${example.exampleIndex + 1}`);
  const groupName = example.exampleGroup.name?.trim();
  if (groupName) {
    segments.push(groupName);
  }
  const valueSummary = formatExampleValues(example.exampleGroup, example.exampleIndex);
  if (valueSummary) {
    segments.push(valueSummary);
  }
  return segments.length > 0 ? segments.join(" · ") : undefined;
}

function formatExampleValues(
  group: ScenarioOutlineExample<unknown>["exampleGroup"],
  index: number
): string | undefined {
  const headers = group.tableHeader ?? [];
  const rows = group.tableBody ?? [];
  const row = rows[index];
  if (!row || headers.length === 0) {
    return undefined;
  }
  const pairs: string[] = [];
  headers.forEach((header, headerIndex) => {
    const key = header?.trim();
    if (!key) {
      return;
    }
    const value = row[headerIndex] ?? "";
    pairs.push(`${key}=${String(value).trim()}`);
  });
  return pairs.length > 0 ? pairs.join(", ") : undefined;
}
