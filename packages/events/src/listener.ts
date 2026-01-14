import type { EventDispatcher } from "./dispatcher.js";
import { getEventDispatcher } from "./bus.js";
import type {
  BackgroundLifecycleEvent,
  ErrorEvent,
  EventEnvelope,
  ExampleLifecycleEvent,
  FeatureLifecycleEvent,
  HookEvent,
  RuleLifecycleEvent,
  ScenarioLifecycleEvent,
  ScenarioOutlineLifecycleEvent,
  StatusEvent,
  StepEvent,
  TestEvent,
} from "./types.js";

export interface TestListener {
  onEvent?(envelope: EventEnvelope<TestEvent>): void | Promise<void>;
  onFeatureStarted?(envelope: EventEnvelope<FeatureLifecycleEvent>): void | Promise<void>;
  onFeatureCompleted?(envelope: EventEnvelope<FeatureLifecycleEvent>): void | Promise<void>;
  onRuleStarted?(envelope: EventEnvelope<RuleLifecycleEvent>): void | Promise<void>;
  onRuleCompleted?(envelope: EventEnvelope<RuleLifecycleEvent>): void | Promise<void>;
  onScenarioStarted?(envelope: EventEnvelope<ScenarioLifecycleEvent>): void | Promise<void>;
  onScenarioCompleted?(envelope: EventEnvelope<ScenarioLifecycleEvent>): void | Promise<void>;
  onScenarioOutlineStarted?(
    envelope: EventEnvelope<ScenarioOutlineLifecycleEvent>
  ): void | Promise<void>;
  onScenarioOutlineCompleted?(
    envelope: EventEnvelope<ScenarioOutlineLifecycleEvent>
  ): void | Promise<void>;
  onExampleStarted?(envelope: EventEnvelope<ExampleLifecycleEvent>): void | Promise<void>;
  onExampleCompleted?(envelope: EventEnvelope<ExampleLifecycleEvent>): void | Promise<void>;
  onBackgroundStarted?(envelope: EventEnvelope<BackgroundLifecycleEvent>): void | Promise<void>;
  onBackgroundCompleted?(envelope: EventEnvelope<BackgroundLifecycleEvent>): void | Promise<void>;
  onStepStarted?(envelope: EventEnvelope<StepEvent>): void | Promise<void>;
  onStepCompleted?(envelope: EventEnvelope<StepEvent>): void | Promise<void>;
  onHookStarted?(envelope: EventEnvelope<HookEvent>): void | Promise<void>;
  onHookCompleted?(envelope: EventEnvelope<HookEvent>): void | Promise<void>;
  onStatusChanged?(envelope: EventEnvelope<StatusEvent>): void | Promise<void>;
  onError?(envelope: EventEnvelope<ErrorEvent>): void | Promise<void>;
}

export function registerTestListener(
  listener: TestListener,
  options: { dispatcher?: EventDispatcher } = {}
): () => void {
  const dispatcher = options.dispatcher ?? getEventDispatcher();
  const unsubscribers: Array<() => void> = [];

  const subscribe = <T extends TestEvent>(
    type: T["type"],
    handler?: (envelope: EventEnvelope<T>) => void | Promise<void>
  ) => {
    if (!handler && !listener.onEvent) {
      return;
    }

    unsubscribers.push(
      dispatcher.subscribe(type, async (envelope) => {
        if (listener.onEvent) {
          await listener.onEvent(envelope as EventEnvelope<TestEvent>);
        }
        if (handler) {
          await handler(envelope);
        }
      })
    );
  };

  subscribe<FeatureLifecycleEvent>("feature.started", listener.onFeatureStarted);
  subscribe<FeatureLifecycleEvent>("feature.completed", listener.onFeatureCompleted);
  subscribe<RuleLifecycleEvent>("rule.started", listener.onRuleStarted);
  subscribe<RuleLifecycleEvent>("rule.completed", listener.onRuleCompleted);
  subscribe<ScenarioLifecycleEvent>("scenario.started", listener.onScenarioStarted);
  subscribe<ScenarioLifecycleEvent>("scenario.completed", listener.onScenarioCompleted);
  subscribe<ScenarioOutlineLifecycleEvent>(
    "scenarioOutline.started",
    listener.onScenarioOutlineStarted
  );
  subscribe<ScenarioOutlineLifecycleEvent>(
    "scenarioOutline.completed",
    listener.onScenarioOutlineCompleted
  );
  subscribe<ExampleLifecycleEvent>("example.started", listener.onExampleStarted);
  subscribe<ExampleLifecycleEvent>("example.completed", listener.onExampleCompleted);
  subscribe<BackgroundLifecycleEvent>("background.started", listener.onBackgroundStarted);
  subscribe<BackgroundLifecycleEvent>("background.completed", listener.onBackgroundCompleted);
  subscribe<StepEvent>("step.started", listener.onStepStarted);
  subscribe<StepEvent>("step.completed", listener.onStepCompleted);
  subscribe<HookEvent>("hook.started", listener.onHookStarted);
  subscribe<HookEvent>("hook.completed", listener.onHookCompleted);
  subscribe<StatusEvent>("status.changed", listener.onStatusChanged);
  subscribe<ErrorEvent>("error", listener.onError);

  return () => {
    for (const unsubscribe of unsubscribers) {
      unsubscribe();
    }
  };
}
