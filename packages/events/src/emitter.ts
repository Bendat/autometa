import type {
  SimpleExampleGroup,
  SimplePickle,
  SimplePickleFeatureRef,
  SimplePickleRuleRef,
  SimplePickleScenarioRef,
  SimplePickleStep,
  SimpleScenario,
  SimpleScenarioOutline,
} from "@autometa/gherkin";
import { EventDispatcher, type DispatchContext } from "./dispatcher.js";
import type { HookDescriptor } from "./hooks.js";
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
} from "./types.js";
import type { TestStatus } from "./status.js";

const defaultIdFactory = (): string => {
  const crypto = (
    globalThis as typeof globalThis & {
      crypto?: { randomUUID?: () => string };
    }
  ).crypto;
  if (crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export interface EventEmitterOptions {
  createId?: () => string;
  now?: () => number;
}

interface BaseEmitOptions {
  id?: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface FeatureLifecycleOptions extends BaseEmitOptions {
  feature: SimplePickleFeatureRef;
}

export interface RuleLifecycleOptions extends FeatureLifecycleOptions {
  rule: SimplePickleRuleRef;
}

export interface ScenarioLifecycleOptions extends BaseEmitOptions {
  feature: SimplePickleFeatureRef;
  scenario: SimplePickleScenarioRef;
  pickle: SimplePickle;
  rule?: SimplePickleRuleRef;
}

export interface ScenarioOutlineLifecycleOptions extends BaseEmitOptions {
  feature: SimplePickleFeatureRef;
  scenarioOutline: SimpleScenarioOutline;
  rule?: SimplePickleRuleRef;
}

export interface ExampleLifecycleOptions extends BaseEmitOptions {
  feature: SimplePickleFeatureRef;
  scenarioOutline: SimpleScenarioOutline;
  example: SimpleExampleGroup;
  pickle: SimplePickle;
  rule?: SimplePickleRuleRef;
}

export interface BackgroundLifecycleOptions extends BaseEmitOptions {
  feature: SimplePickleFeatureRef;
  background: SimpleScenario;
  pickle: SimplePickle;
  rule?: SimplePickleRuleRef;
}

export interface StepLifecycleOptions extends ScenarioLifecycleOptions {
  step: SimplePickleStep;
}

export interface HookEmitOptions extends BaseEmitOptions {
  hook: HookDescriptor;
}

export interface StatusEmitOptions extends BaseEmitOptions {
  status: TestStatus;
  previousStatus?: TestStatus;
  feature?: SimplePickleFeatureRef;
  rule?: SimplePickleRuleRef;
  scenario?: SimplePickleScenarioRef;
  scenarioOutline?: SimpleScenarioOutline;
  example?: SimpleExampleGroup;
  pickle?: SimplePickle;
}

export interface ErrorEmitOptions extends BaseEmitOptions {
  error: unknown;
  phase: ErrorEvent["phase"];
  feature?: SimplePickleFeatureRef;
  rule?: SimplePickleRuleRef;
  scenario?: SimplePickleScenarioRef;
  scenarioOutline?: SimpleScenarioOutline;
  example?: SimpleExampleGroup;
  background?: SimpleScenario;
  pickle?: SimplePickle;
}

export class EventEmitter {
  private readonly createId: () => string;
  private readonly now: () => number;

  constructor(
    private readonly dispatcher: EventDispatcher,
    options: EventEmitterOptions = {}
  ) {
    this.createId = options.createId ?? defaultIdFactory;
    this.now = options.now ?? Date.now;
  }

  async featureStarted(options: FeatureLifecycleOptions): Promise<void> {
    const event: FeatureLifecycleEvent = {
      type: "feature.started",
      feature: options.feature,
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async featureCompleted(options: FeatureLifecycleOptions): Promise<void> {
    const event: FeatureLifecycleEvent = {
      type: "feature.completed",
      feature: options.feature,
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async ruleStarted(options: RuleLifecycleOptions): Promise<void> {
    const event: RuleLifecycleEvent = {
      type: "rule.started",
      feature: options.feature,
      rule: options.rule,
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async ruleCompleted(options: RuleLifecycleOptions): Promise<void> {
    const event: RuleLifecycleEvent = {
      type: "rule.completed",
      feature: options.feature,
      rule: options.rule,
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async scenarioStarted(options: ScenarioLifecycleOptions): Promise<void> {
    const event: ScenarioLifecycleEvent = {
      type: "scenario.started",
      feature: options.feature,
      scenario: options.scenario,
      pickle: options.pickle,
      ...(options.rule ? { rule: options.rule } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async scenarioCompleted(options: ScenarioLifecycleOptions): Promise<void> {
    const event: ScenarioLifecycleEvent = {
      type: "scenario.completed",
      feature: options.feature,
      scenario: options.scenario,
      pickle: options.pickle,
      ...(options.rule ? { rule: options.rule } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async scenarioOutlineStarted(
    options: ScenarioOutlineLifecycleOptions
  ): Promise<void> {
    const event: ScenarioOutlineLifecycleEvent = {
      type: "scenarioOutline.started",
      feature: options.feature,
      scenarioOutline: options.scenarioOutline,
      ...(options.rule ? { rule: options.rule } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async scenarioOutlineCompleted(
    options: ScenarioOutlineLifecycleOptions
  ): Promise<void> {
    const event: ScenarioOutlineLifecycleEvent = {
      type: "scenarioOutline.completed",
      feature: options.feature,
      scenarioOutline: options.scenarioOutline,
      ...(options.rule ? { rule: options.rule } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async exampleStarted(options: ExampleLifecycleOptions): Promise<void> {
    const event: ExampleLifecycleEvent = {
      type: "example.started",
      feature: options.feature,
      scenarioOutline: options.scenarioOutline,
      example: options.example,
      pickle: options.pickle,
      ...(options.rule ? { rule: options.rule } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async exampleCompleted(options: ExampleLifecycleOptions): Promise<void> {
    const event: ExampleLifecycleEvent = {
      type: "example.completed",
      feature: options.feature,
      scenarioOutline: options.scenarioOutline,
      example: options.example,
      pickle: options.pickle,
      ...(options.rule ? { rule: options.rule } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async backgroundStarted(options: BackgroundLifecycleOptions): Promise<void> {
    const event: BackgroundLifecycleEvent = {
      type: "background.started",
      feature: options.feature,
      background: options.background,
      pickle: options.pickle,
      ...(options.rule ? { rule: options.rule } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async backgroundCompleted(
    options: BackgroundLifecycleOptions
  ): Promise<void> {
    const event: BackgroundLifecycleEvent = {
      type: "background.completed",
      feature: options.feature,
      background: options.background,
      pickle: options.pickle,
      ...(options.rule ? { rule: options.rule } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async stepStarted(options: StepLifecycleOptions): Promise<void> {
    const event: StepEvent = {
      type: "step.started",
      feature: options.feature,
      scenario: options.scenario,
      step: options.step,
      pickle: options.pickle,
      ...(options.rule ? { rule: options.rule } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, this.stepContext(options));
  }

  async stepCompleted(options: StepLifecycleOptions): Promise<void> {
    const event: StepEvent = {
      type: "step.completed",
      feature: options.feature,
      scenario: options.scenario,
      step: options.step,
      pickle: options.pickle,
      ...(options.rule ? { rule: options.rule } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, this.stepContext(options));
  }

  async hookStarted(options: HookEmitOptions): Promise<void> {
    const event: HookEvent = {
      type: "hook.started",
      hook: options.hook,
      ...(options.hook.feature ? { feature: options.hook.feature } : {}),
      ...(options.hook.rule ? { rule: options.hook.rule } : {}),
      ...(options.hook.scenario ? { scenario: options.hook.scenario } : {}),
      ...(options.hook.scenarioOutline
        ? { scenarioOutline: options.hook.scenarioOutline }
        : {}),
      ...(options.hook.example ? { example: options.hook.example } : {}),
      ...(options.hook.background ? { background: options.hook.background } : {}),
      ...(options.hook.step ? { step: options.hook.step } : {}),
      ...(options.hook.pickle ? { pickle: options.hook.pickle } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async hookCompleted(options: HookEmitOptions): Promise<void> {
    const event: HookEvent = {
      type: "hook.completed",
      hook: options.hook,
      ...(options.hook.feature ? { feature: options.hook.feature } : {}),
      ...(options.hook.rule ? { rule: options.hook.rule } : {}),
      ...(options.hook.scenario ? { scenario: options.hook.scenario } : {}),
      ...(options.hook.scenarioOutline
        ? { scenarioOutline: options.hook.scenarioOutline }
        : {}),
      ...(options.hook.example ? { example: options.hook.example } : {}),
      ...(options.hook.background ? { background: options.hook.background } : {}),
      ...(options.hook.step ? { step: options.hook.step } : {}),
      ...(options.hook.pickle ? { pickle: options.hook.pickle } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async statusChanged(options: StatusEmitOptions): Promise<void> {
    const event: StatusEvent = {
      type: "status.changed",
      status: options.status,
      ...(options.previousStatus ? { previousStatus: options.previousStatus } : {}),
      ...(options.feature ? { feature: options.feature } : {}),
      ...(options.rule ? { rule: options.rule } : {}),
      ...(options.scenario ? { scenario: options.scenario } : {}),
      ...(options.scenarioOutline
        ? { scenarioOutline: options.scenarioOutline }
        : {}),
      ...(options.example ? { example: options.example } : {}),
      ...(options.pickle ? { pickle: options.pickle } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  async errorRaised(options: ErrorEmitOptions): Promise<void> {
    const event: ErrorEvent = {
      type: "error",
      error: options.error,
      phase: options.phase,
      ...(options.feature ? { feature: options.feature } : {}),
      ...(options.rule ? { rule: options.rule } : {}),
      ...(options.scenario ? { scenario: options.scenario } : {}),
      ...(options.scenarioOutline
        ? { scenarioOutline: options.scenarioOutline }
        : {}),
      ...(options.example ? { example: options.example } : {}),
      ...(options.background ? { background: options.background } : {}),
      ...(options.pickle ? { pickle: options.pickle } : {}),
      ...this.base(options),
    };
    await this.dispatcher.dispatch(event, { tags: options.tags ?? [] });
  }

  private base(options: BaseEmitOptions): {
    id: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
  } {
    const base = {
      id: options.id ?? this.createId(),
      timestamp: options.timestamp ?? this.now(),
    } as {
      id: string;
      timestamp: number;
      metadata?: Record<string, unknown>;
    };

    if (options.metadata !== undefined) {
      base.metadata = options.metadata;
    }

    return base;
  }

  /**
   * Build dispatch context for step events, extracting docstring and table
   * from the step if present.
   */
  private stepContext(options: StepLifecycleOptions): DispatchContext {
    const { step, tags } = options;
    const context: DispatchContext = { tags: tags ?? [] };

    if (step.docString) {
      context.docstring = {
        content: step.docString,
        ...(step.docStringMediaType !== undefined && {
          mediaType: step.docStringMediaType,
        }),
      };
    }

    if (step.dataTable) {
      context.table = step.dataTable;
    }

    return context;
  }
}
