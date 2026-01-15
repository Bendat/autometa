import { describe, expect, it } from "vitest";
import { EventEmitter } from "../emitter.js";
import { EventDispatcher } from "../dispatcher.js";
import { HookKind, type HookDescriptor } from "../hooks.js";
import { TestStatus } from "../status.js";
import type {
  BackgroundLifecycleEvent,
  ErrorEvent,
  ExampleLifecycleEvent,
  FeatureLifecycleEvent,
  HookEvent,
  RuleLifecycleEvent,
  ScenarioLifecycleEvent,
  ScenarioOutlineLifecycleEvent,
  StatusEvent,
  StepEvent,
  TestEvent,
} from "../types.js";
import type {
  SimpleExampleGroup,
  SimplePickle,
  SimplePickleFeatureRef,
  SimplePickleRuleRef,
  SimplePickleScenarioRef,
  SimplePickleStep,
  SimpleScenario,
  SimpleScenarioOutline,
} from "../../../gherkin/src/types";

describe("EventEmitter", () => {
  const location = { line: 1, column: 1 } as const;

  const createFeature = (): SimplePickleFeatureRef => ({
    id: "feature-id",
    name: "Sample Feature",
    location,
    tags: [],
    comments: [],
  });

  const createRule = (): SimplePickleRuleRef => ({
    id: "rule-id",
    name: "Sample Rule",
    location,
    tags: [],
    comments: [],
  });

  const createScenarioRef = (): SimplePickleScenarioRef => ({
    id: "scenario-id",
    name: "Sample Scenario",
    location,
    tags: [],
    comments: [],
    type: "scenario",
  });

  const createScenarioOutline = (): SimpleScenarioOutline => ({
    id: "outline-id",
    keyword: "Scenario Outline",
    name: "Sample Outline",
    description: "",
    tags: [],
    steps: [],
    exampleGroups: [],
    compiledScenarios: [],
    location,
  });

  const createExampleGroup = (): SimpleExampleGroup => ({
    id: "examples-id",
    keyword: "Examples",
    name: "Example Set",
    description: "",
    tags: [],
    tableHeader: [],
    tableBody: [],
    location,
  });

  const createBackground = (): SimpleScenario => ({
    id: "background-id",
    keyword: "Background",
    name: "Background",
    description: "",
    tags: [],
    steps: [],
    location,
  });

  const createStep = (
    feature: SimplePickleFeatureRef,
    scenario: SimplePickleScenarioRef,
    rule?: SimplePickleRuleRef
  ): SimplePickleStep => ({
    id: `step-${scenario.id}`,
    keyword: "Given",
    keywordType: "given",
    type: "context",
    text: "a thing happens",
    location,
    astNodeIds: [],
    scenario,
    feature,
    ...(rule ? { rule } : {}),
    tags: [],
    language: "en",
  });

  const createPickle = (
    feature: SimplePickleFeatureRef,
    scenario: SimplePickleScenarioRef,
    rule?: SimplePickleRuleRef
  ): SimplePickle => ({
    id: "pickle-id",
    name: scenario.name,
    language: "en",
    steps: [],
    tags: [],
    uri: "feature.feature",
    feature,
    scenario,
    ...(rule ? { rule } : {}),
  });

  const once = <T extends TestEvent>(
    dispatcher: EventDispatcher,
    type: T["type"]
  ): Promise<T> =>
    new Promise((resolve) => {
      const unsubscribe = dispatcher.subscribe<T>(type, (envelope) => {
        unsubscribe();
        resolve(envelope.event);
      });
    });

  const onceEnvelope = <T extends TestEvent>(
    dispatcher: EventDispatcher,
    type: T["type"]
  ): Promise<import("../types.js").EventEnvelope<T>> =>
    new Promise((resolve) => {
      const unsubscribe = dispatcher.subscribe<T>(type, (envelope) => {
        unsubscribe();
        resolve(envelope);
      });
    });

  it("emits lifecycle events with deterministic ids and metadata", async () => {
    let counter = 0;
    const dispatcher = new EventDispatcher();
    const emitter = new EventEmitter(dispatcher, {
      createId: () => `id-${++counter}`,
      now: () => 1_000 + counter,
    });

    const feature = createFeature();
    const rule = createRule();
    const scenario = createScenarioRef();
    const outline = createScenarioOutline();
    const exampleGroup = createExampleGroup();
    const background = createBackground();
    const pickleWithRule = createPickle(feature, scenario, rule);
    const pickleWithoutRule = createPickle(feature, scenario);

    const featureStarted = once<FeatureLifecycleEvent>(
      dispatcher,
      "feature.started"
    );
    await emitter.featureStarted({
      feature,
      metadata: { phase: "start" },
    });
    const featureStartedEvent = await featureStarted;
    expect(featureStartedEvent.id).toBe("id-1");
    expect(featureStartedEvent.timestamp).toBe(1001);
    expect(featureStartedEvent.metadata).toEqual({ phase: "start" });

    const featureCompleted = once<FeatureLifecycleEvent>(
      dispatcher,
      "feature.completed"
    );
    await emitter.featureCompleted({
      feature,
      id: "custom-id",
      timestamp: 2000,
    });
    const featureCompletedEvent = await featureCompleted;
    expect(featureCompletedEvent.id).toBe("custom-id");
    expect(featureCompletedEvent.timestamp).toBe(2000);

    const ruleStarted = once<RuleLifecycleEvent>(dispatcher, "rule.started");
    await emitter.ruleStarted({ feature, rule });
    const ruleStartedEvent = await ruleStarted;
    expect(ruleStartedEvent.rule).toBe(rule);

    const ruleCompleted = once<RuleLifecycleEvent>(
      dispatcher,
      "rule.completed"
    );
    await emitter.ruleCompleted({ feature, rule });
    const ruleCompletedEvent = await ruleCompleted;
    expect(ruleCompletedEvent.rule).toBe(rule);

    const scenarioStarted = once<ScenarioLifecycleEvent>(
      dispatcher,
      "scenario.started"
    );
    await emitter.scenarioStarted({
      feature,
      scenario,
      pickle: pickleWithRule,
      rule,
      metadata: { phase: "scenario" },
    });
    const scenarioStartedEvent = await scenarioStarted;
    expect(scenarioStartedEvent.rule).toBe(rule);
    expect(scenarioStartedEvent.metadata).toEqual({ phase: "scenario" });

    const scenarioCompleted = once<ScenarioLifecycleEvent>(
      dispatcher,
      "scenario.completed"
    );
    await emitter.scenarioCompleted({
      feature,
      scenario,
      pickle: pickleWithoutRule,
    });
    const scenarioCompletedEvent = await scenarioCompleted;
    expect(scenarioCompletedEvent.rule).toBeUndefined();
    expect(scenarioCompletedEvent.metadata).toBeUndefined();

    const scenarioCompletedWithRule = once<ScenarioLifecycleEvent>(
      dispatcher,
      "scenario.completed"
    );
    await emitter.scenarioCompleted({
      feature,
      scenario,
      pickle: pickleWithRule,
      rule,
    });
    const scenarioCompletedWithRuleEvent = await scenarioCompletedWithRule;
    expect(scenarioCompletedWithRuleEvent.rule).toBe(rule);

    const outlineStarted = once<ScenarioOutlineLifecycleEvent>(
      dispatcher,
      "scenarioOutline.started"
    );
    await emitter.scenarioOutlineStarted({
      feature,
      scenarioOutline: outline,
      rule,
    });
    const outlineStartedEvent = await outlineStarted;
    expect(outlineStartedEvent.scenarioOutline).toBe(outline);
    expect(outlineStartedEvent.rule).toBe(rule);

    const outlineCompleted = once<ScenarioOutlineLifecycleEvent>(
      dispatcher,
      "scenarioOutline.completed"
    );
    await emitter.scenarioOutlineCompleted({
      feature,
      scenarioOutline: outline,
    });
    const outlineCompletedEvent = await outlineCompleted;
    expect(outlineCompletedEvent.rule).toBeUndefined();

    const outlineCompletedWithRule = once<ScenarioOutlineLifecycleEvent>(
      dispatcher,
      "scenarioOutline.completed"
    );
    await emitter.scenarioOutlineCompleted({
      feature,
      scenarioOutline: outline,
      rule,
    });
    const outlineCompletedWithRuleEvent = await outlineCompletedWithRule;
    expect(outlineCompletedWithRuleEvent.rule).toBe(rule);

    const exampleStarted = once<ExampleLifecycleEvent>(
      dispatcher,
      "example.started"
    );
    await emitter.exampleStarted({
      feature,
      scenarioOutline: outline,
      example: exampleGroup,
      pickle: pickleWithRule,
      rule,
    });
    const exampleStartedEvent = await exampleStarted;
    expect(exampleStartedEvent.example).toBe(exampleGroup);
    expect(exampleStartedEvent.rule).toBe(rule);

    const exampleCompleted = once<ExampleLifecycleEvent>(
      dispatcher,
      "example.completed"
    );
    await emitter.exampleCompleted({
      feature,
      scenarioOutline: outline,
      example: exampleGroup,
      pickle: pickleWithoutRule,
    });
    const exampleCompletedEvent = await exampleCompleted;
    expect(exampleCompletedEvent.rule).toBeUndefined();

    const exampleCompletedWithRule = once<ExampleLifecycleEvent>(
      dispatcher,
      "example.completed"
    );
    await emitter.exampleCompleted({
      feature,
      scenarioOutline: outline,
      example: exampleGroup,
      pickle: pickleWithRule,
      rule,
    });
    const exampleCompletedWithRuleEvent = await exampleCompletedWithRule;
    expect(exampleCompletedWithRuleEvent.rule).toBe(rule);

    const backgroundStarted = once<BackgroundLifecycleEvent>(
      dispatcher,
      "background.started"
    );
    await emitter.backgroundStarted({
      feature,
      background,
      pickle: pickleWithRule,
      rule,
    });
    const backgroundStartedEvent = await backgroundStarted;
    expect(backgroundStartedEvent.background).toBe(background);
    expect(backgroundStartedEvent.rule).toBe(rule);

    const backgroundCompleted = once<BackgroundLifecycleEvent>(
      dispatcher,
      "background.completed"
    );
    await emitter.backgroundCompleted({
      feature,
      background,
      pickle: pickleWithoutRule,
    });
    const backgroundCompletedEvent = await backgroundCompleted;
    expect(backgroundCompletedEvent.rule).toBeUndefined();

    const backgroundCompletedWithRule = once<BackgroundLifecycleEvent>(
      dispatcher,
      "background.completed"
    );
    await emitter.backgroundCompleted({
      feature,
      background,
      pickle: pickleWithRule,
      rule,
    });
    const backgroundCompletedWithRuleEvent = await backgroundCompletedWithRule;
    expect(backgroundCompletedWithRuleEvent.rule).toBe(rule);

    const stepWithRule = createStep(feature, scenario, rule);
    const stepStarted = once<StepEvent>(dispatcher, "step.started");
    await emitter.stepStarted({
      feature,
      scenario,
      step: stepWithRule,
      pickle: pickleWithRule,
      rule,
    });
    const stepStartedEvent = await stepStarted;
    expect(stepStartedEvent.step).toBe(stepWithRule);
    expect(stepStartedEvent.rule).toBe(rule);

    const stepStartedWithoutRule = once<StepEvent>(dispatcher, "step.started");
    const minimalStep = createStep(feature, scenario);
    await emitter.stepStarted({
      feature,
      scenario,
      step: minimalStep,
      pickle: pickleWithoutRule,
    });
    const stepStartedWithoutRuleEvent = await stepStartedWithoutRule;
    expect(stepStartedWithoutRuleEvent.rule).toBeUndefined();

    const stepWithoutRule = createStep(feature, scenario);
    const stepCompleted = once<StepEvent>(dispatcher, "step.completed");
    await emitter.stepCompleted({
      feature,
      scenario,
      step: stepWithoutRule,
      pickle: pickleWithoutRule,
    });
    const stepCompletedEvent = await stepCompleted;
    expect(stepCompletedEvent.rule).toBeUndefined();

    const stepCompletedWithRule = once<StepEvent>(dispatcher, "step.completed");
    await emitter.stepCompleted({
      feature,
      scenario,
      step: stepWithRule,
      pickle: pickleWithRule,
      rule,
    });
    const stepCompletedWithRuleEvent = await stepCompletedWithRule;
    expect(stepCompletedWithRuleEvent.rule).toBe(rule);
  });

  it("emits hook, status, and error events with contextual data", async () => {
    let counter = 0;
    const dispatcher = new EventDispatcher();
    const emitter = new EventEmitter(dispatcher, {
      createId: () => `id-${++counter}`,
      now: () => 500 + counter,
    });

    const feature = createFeature();
    const rule = createRule();
    const scenario = createScenarioRef();
    const outline = createScenarioOutline();
    const exampleGroup = createExampleGroup();
    const background = createBackground();
    const step = createStep(feature, scenario, rule);
    const pickle = createPickle(feature, scenario, rule);

    const hookDescriptor: HookDescriptor = {
      kind: HookKind.BEFORE_SCENARIO,
      name: "before scenario",
      source: "tests/hooks.ts",
      feature,
      rule,
      scenario,
      scenarioOutline: outline,
      example: exampleGroup,
      background,
      step,
      pickle,
      metadata: { label: "hook" },
    };

    const hookStarted = once<HookEvent>(dispatcher, "hook.started");
    await emitter.hookStarted({ hook: hookDescriptor, metadata: { stage: "begin" } });
    const hookStartedEvent = await hookStarted;
    expect(hookStartedEvent.hook).toBe(hookDescriptor);
    expect(hookStartedEvent.feature).toBe(feature);
    expect(hookStartedEvent.metadata).toEqual({ stage: "begin" });

    const hookCompleted = once<HookEvent>(dispatcher, "hook.completed");
    await emitter.hookCompleted({ hook: hookDescriptor });
    const hookCompletedEvent = await hookCompleted;
    expect(hookCompletedEvent.step).toBe(step);

    const statusChanged = once<StatusEvent>(dispatcher, "status.changed");
    await emitter.statusChanged({
      status: TestStatus.PASSED,
      previousStatus: TestStatus.RUNNING,
      feature,
      rule,
      scenario,
      scenarioOutline: outline,
      example: exampleGroup,
      pickle,
    });
    const statusEvent = await statusChanged;
    expect(statusEvent.status).toBe(TestStatus.PASSED);
    expect(statusEvent.previousStatus).toBe(TestStatus.RUNNING);
    expect(statusEvent.rule).toBe(rule);

    const errorRaised = once<ErrorEvent>(dispatcher, "error");
    const error = new Error("boom");
    await emitter.errorRaised({
      error,
      phase: "scenario",
      feature,
      rule,
      scenario,
      scenarioOutline: outline,
      example: exampleGroup,
      background,
      pickle,
      metadata: { severity: "high" },
    });
    const errorEvent = await errorRaised;
    expect(errorEvent.error).toBe(error);
    expect(errorEvent.phase).toBe("scenario");
    expect(errorEvent.background).toBe(background);
    expect(errorEvent.metadata).toEqual({ severity: "high" });
  });

  it("omits optional fields when not provided", async () => {
    let counter = 0;
    const dispatcher = new EventDispatcher();
    const emitter = new EventEmitter(dispatcher, {
      createId: () => `minimal-${++counter}`,
      now: () => 10_000 + counter,
    });

    const feature = createFeature();
    const scenario = createScenarioRef();
    const outline = createScenarioOutline();
    const exampleGroup = createExampleGroup();
    const background = createBackground();
    const pickle = createPickle(feature, scenario);
    const step = createStep(feature, scenario);

    const featureStarted = once<FeatureLifecycleEvent>(
      dispatcher,
      "feature.started"
    );
    await emitter.featureStarted({ feature });
    const featureStartedEvent = await featureStarted;
    expect(featureStartedEvent.metadata).toBeUndefined();

    const featureCompleted = once<FeatureLifecycleEvent>(
      dispatcher,
      "feature.completed"
    );
    await emitter.featureCompleted({ feature });
    const featureCompletedEvent = await featureCompleted;
    expect(featureCompletedEvent.id).toBe("minimal-2");

    const scenarioStarted = once<ScenarioLifecycleEvent>(
      dispatcher,
      "scenario.started"
    );
    await emitter.scenarioStarted({ feature, scenario, pickle });
    const scenarioStartedEvent = await scenarioStarted;
    expect(scenarioStartedEvent.rule).toBeUndefined();

    const scenarioCompleted = once<ScenarioLifecycleEvent>(
      dispatcher,
      "scenario.completed"
    );
    await emitter.scenarioCompleted({ feature, scenario, pickle });
    const scenarioCompletedEvent = await scenarioCompleted;
    expect(scenarioCompletedEvent.rule).toBeUndefined();

    const outlineStarted = once<ScenarioOutlineLifecycleEvent>(
      dispatcher,
      "scenarioOutline.started"
    );
    await emitter.scenarioOutlineStarted({
      feature,
      scenarioOutline: outline,
    });
    const outlineStartedEvent = await outlineStarted;
    expect(outlineStartedEvent.rule).toBeUndefined();

    const outlineCompleted = once<ScenarioOutlineLifecycleEvent>(
      dispatcher,
      "scenarioOutline.completed"
    );
    await emitter.scenarioOutlineCompleted({
      feature,
      scenarioOutline: outline,
    });
    const outlineCompletedEvent = await outlineCompleted;
    expect(outlineCompletedEvent.rule).toBeUndefined();

    const exampleStarted = once<ExampleLifecycleEvent>(
      dispatcher,
      "example.started"
    );
    await emitter.exampleStarted({
      feature,
      scenarioOutline: outline,
      example: exampleGroup,
      pickle,
    });
    const exampleStartedEvent = await exampleStarted;
    expect(exampleStartedEvent.rule).toBeUndefined();

    const exampleCompleted = once<ExampleLifecycleEvent>(
      dispatcher,
      "example.completed"
    );
    await emitter.exampleCompleted({
      feature,
      scenarioOutline: outline,
      example: exampleGroup,
      pickle,
    });
    const exampleCompletedEvent = await exampleCompleted;
    expect(exampleCompletedEvent.rule).toBeUndefined();

    const backgroundStarted = once<BackgroundLifecycleEvent>(
      dispatcher,
      "background.started"
    );
    await emitter.backgroundStarted({
      feature,
      background,
      pickle,
    });
    const backgroundStartedEvent = await backgroundStarted;
    expect(backgroundStartedEvent.rule).toBeUndefined();

    const backgroundCompleted = once<BackgroundLifecycleEvent>(
      dispatcher,
      "background.completed"
    );
    await emitter.backgroundCompleted({
      feature,
      background,
      pickle,
    });
    const backgroundCompletedEvent = await backgroundCompleted;
    expect(backgroundCompletedEvent.rule).toBeUndefined();

    const stepStarted = once<StepEvent>(dispatcher, "step.started");
    await emitter.stepStarted({
      feature,
      scenario,
      step,
      pickle,
    });
    const stepStartedEvent = await stepStarted;
    expect(stepStartedEvent.rule).toBeUndefined();

    const stepCompleted = once<StepEvent>(dispatcher, "step.completed");
    await emitter.stepCompleted({
      feature,
      scenario,
      step,
      pickle,
    });
    const stepCompletedEvent = await stepCompleted;
    expect(stepCompletedEvent.rule).toBeUndefined();

    const hookDescriptor: HookDescriptor = { kind: HookKind.CUSTOM };
    const hookStarted = once<HookEvent>(dispatcher, "hook.started");
    await emitter.hookStarted({ hook: hookDescriptor });
    const hookStartedEvent = await hookStarted;
    expect(hookStartedEvent.feature).toBeUndefined();
    expect(hookStartedEvent.metadata).toBeUndefined();

    const statusChanged = once<StatusEvent>(dispatcher, "status.changed");
    await emitter.statusChanged({ status: TestStatus.RUNNING });
    const statusEvent = await statusChanged;
    expect(statusEvent.previousStatus).toBeUndefined();
    expect(statusEvent.feature).toBeUndefined();

    const errorRaised = once<ErrorEvent>(dispatcher, "error");
    const error = new Error("minimal");
    await emitter.errorRaised({ error, phase: "runner" });
    const errorEvent = await errorRaised;
    expect(errorEvent.error).toBe(error);
    expect(errorEvent.feature).toBeUndefined();
    expect(errorEvent.metadata).toBeUndefined();
  });

  it("passes docstring and table through to the envelope on step events", async () => {
    const dispatcher = new EventDispatcher();
    const emitter = new EventEmitter(dispatcher);

    const feature = createFeature();
    const scenario = createScenarioRef();
    const pickle = createPickle(feature, scenario);

    const stepWithDocstring: SimplePickleStep = {
      ...createStep(feature, scenario),
      docString: "Hello world",
      docStringMediaType: "text/plain",
    };

    const started = onceEnvelope<StepEvent>(dispatcher, "step.started");
    await emitter.stepStarted({
      feature,
      scenario,
      step: stepWithDocstring,
      pickle,
    });
    const envelope = await started;
    expect(envelope.docstring).toEqual({
      content: "Hello world",
      mediaType: "text/plain",
    });
    expect(envelope.currentScope).toBe("step");

    const stepWithTable: SimplePickleStep = {
      ...createStep(feature, scenario),
      dataTable: [
        ["name", "age"],
        ["Bob", "42"],
      ],
    };

    const completed = onceEnvelope<StepEvent>(dispatcher, "step.completed");
    await emitter.stepCompleted({
      feature,
      scenario,
      step: stepWithTable,
      pickle,
    });
    const completedEnvelope = await completed;
    expect(completedEnvelope.table).toEqual([
      ["name", "age"],
      ["Bob", "42"],
    ]);
    expect(completedEnvelope.currentScope).toBe("step");
  });
});
