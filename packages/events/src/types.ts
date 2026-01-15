/**
 * Core event types emitted by @autometa/events.
 */
import {
  SimplePickle,
  SimplePickleStep,
  SimplePickleFeatureRef,
  SimplePickleScenarioRef,
  SimplePickleRuleRef,
  SimpleScenarioOutline,
  SimpleExampleGroup,
  SimpleScenario,
} from "@autometa/gherkin";
import type { Token } from "@autometa/injection";
import { HookDescriptor } from "./hooks.js";
import { TestStatus } from "./status.js";

export type TestEvent =
  | LifecycleEvent
  | StepEvent
  | HookEvent
  | StatusEvent
  | ErrorEvent;

export interface LifecycleEventBase {
  /** Unique identifier for the lifecycle instance. */
  id: string;
  /** Timestamp in milliseconds since epoch when the event was published. */
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type LifecycleEvent =
  | FeatureLifecycleEvent
  | RuleLifecycleEvent
  | ScenarioLifecycleEvent
  | ScenarioOutlineLifecycleEvent
  | ExampleLifecycleEvent
  | BackgroundLifecycleEvent;

export interface FeatureLifecycleEvent extends LifecycleEventBase {
  type: "feature.started" | "feature.completed";
  feature: SimplePickleFeatureRef;
}

export interface RuleLifecycleEvent extends LifecycleEventBase {
  type: "rule.started" | "rule.completed";
  feature: SimplePickleFeatureRef;
  rule: SimplePickleRuleRef;
}

export interface ScenarioLifecycleEvent extends LifecycleEventBase {
  type: "scenario.started" | "scenario.completed";
  feature: SimplePickleFeatureRef;
  scenario: SimplePickleScenarioRef;
  pickle: SimplePickle;
  rule?: SimplePickleRuleRef;
}

export interface ScenarioOutlineLifecycleEvent extends LifecycleEventBase {
  type: "scenarioOutline.started" | "scenarioOutline.completed";
  feature: SimplePickleFeatureRef;
  scenarioOutline: SimpleScenarioOutline;
  rule?: SimplePickleRuleRef;
}

export interface ExampleLifecycleEvent extends LifecycleEventBase {
  type: "example.started" | "example.completed";
  feature: SimplePickleFeatureRef;
  scenarioOutline: SimpleScenarioOutline;
  example: SimpleExampleGroup;
  pickle: SimplePickle;
  rule?: SimplePickleRuleRef;
}

export interface BackgroundLifecycleEvent extends LifecycleEventBase {
  type: "background.started" | "background.completed";
  feature: SimplePickleFeatureRef;
  background: SimpleScenario;
  pickle: SimplePickle;
  rule?: SimplePickleRuleRef;
}

export interface StepEvent extends LifecycleEventBase {
  type: "step.started" | "step.completed";
  feature: SimplePickleFeatureRef;
  scenario: SimplePickleScenarioRef;
  step: SimplePickleStep;
  pickle: SimplePickle;
  rule?: SimplePickleRuleRef;
}

export interface HookEvent extends LifecycleEventBase {
  type: "hook.started" | "hook.completed";
  hook: HookDescriptor;
  feature?: SimplePickleFeatureRef;
  rule?: SimplePickleRuleRef;
  scenario?: SimplePickleScenarioRef;
  scenarioOutline?: SimpleScenarioOutline;
  example?: SimpleExampleGroup;
  background?: SimpleScenario;
  step?: SimplePickleStep;
  pickle?: SimplePickle;
}

export interface StatusEvent extends LifecycleEventBase {
  type: "status.changed";
  status: TestStatus;
  previousStatus?: TestStatus;
  feature?: SimplePickleFeatureRef;
  rule?: SimplePickleRuleRef;
  scenario?: SimplePickleScenarioRef;
  scenarioOutline?: SimpleScenarioOutline;
  example?: SimpleExampleGroup;
  pickle?: SimplePickle;
}

export interface ErrorEvent extends LifecycleEventBase {
  type: "error";
  error: unknown;
  phase:
    | "feature"
    | "rule"
    | "scenario"
    | "scenarioOutline"
    | "example"
    | "background"
    | "step"
    | "hook"
    | "runner";
  feature?: SimplePickleFeatureRef;
  rule?: SimplePickleRuleRef;
  scenario?: SimplePickleScenarioRef;
  scenarioOutline?: SimpleScenarioOutline;
  example?: SimpleExampleGroup;
  background?: SimpleScenario;
  pickle?: SimplePickle;
}

export interface EventEnvelope<T extends TestEvent = TestEvent> {
  /** Sequence number for deterministic ordering. */
  sequence: number;
  /** Event payload. */
  event: T;
  /** Resolve a dependency from the container. */
  resolve: <S>(token: Token<S>) => S;
  /** Optional tags for categorization and filtering. */
  tags: string[];
}

export type EventSubscriber<T extends TestEvent = TestEvent> = (
  event: EventEnvelope<T>
) => void | Promise<void>;
