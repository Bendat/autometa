/**
 * Event dispatcher for Autometa lifecycle events.
 */
import {
  createContainer,
  createToken,
  Scope,
  type IContainer,
} from "@autometa/injection";
import type {
  EnvelopeDocstring,
  EventEnvelope,
  EventSubscriber,
  ExecutionScope,
  TestEvent,
} from "./types.js";

export interface EventDispatcherOptions {
  /**
   * Optional container to use for resolving subscribers. If omitted a
   * standalone container is created per dispatcher instance.
   */
  container?: IContainer;
}

/**
 * Additional context attached to an event dispatch.
 */
export interface DispatchContext {
  /** Tags for categorization and filtering. */
  tags?: string[] | undefined;
  /** Current execution scope. */
  currentScope?: ExecutionScope | undefined;
  /** Docstring attached to the current step. */
  docstring?: EnvelopeDocstring | undefined;
  /** Data table attached to the current step. */
  table?: readonly (readonly string[])[] | undefined;
}

export const EventDispatcherToken = createToken<EventDispatcher>(
  "@autometa/events/dispatcher"
);

export class EventDispatcher {
  private readonly subscribers = new Map<string, Set<EventSubscriber>>();
  private sequence = 0;

  constructor(private readonly container: IContainer = createContainer()) {}

  static create(options: EventDispatcherOptions = {}): EventDispatcher {
    const container = options.container ?? createContainer();
    if (!container.isRegistered(EventDispatcherToken)) {
      container.registerValue(
        EventDispatcherToken,
        new EventDispatcher(container),
        { scope: Scope.SINGLETON }
      );
    }
    return container.resolve(EventDispatcherToken);
  }

  /**
   * Subscribe to events of a particular type.
   */
  subscribe<T extends TestEvent>(
    type: T["type"],
    subscriber: EventSubscriber<T>
  ): () => void {
    const set = this.subscribers.get(type) ?? new Set();
    set.add(subscriber as EventSubscriber);
    this.subscribers.set(type, set);

    return () => {
      set.delete(subscriber as EventSubscriber);
      if (set.size === 0) {
        this.subscribers.delete(type);
      }
    };
  }

  /**
   * Publish an event to all registered subscribers. Subscribers are awaited in
   * series to preserve ordering guarantees; callers can fork when concurrency is
   * desired.
   */
  async dispatch<T extends TestEvent>(
    event: T,
    context: DispatchContext = {}
  ): Promise<void> {
    const envelope: EventEnvelope<T> = {
      sequence: ++this.sequence,
      event,
      resolve: (token) => this.container.resolve(token),
      tags: context.tags ?? [],
      currentScope: context.currentScope ?? deriveScope(event.type),
      ...(context.docstring !== undefined && { docstring: context.docstring }),
      ...(context.table !== undefined && { table: context.table }),
    };

    const listeners = this.subscribers.get(event.type);
    if (!listeners || listeners.size === 0) {
      return;
    }

    for (const listener of listeners) {
      await listener(envelope);
    }
  }

  clear(): void {
    this.subscribers.clear();
    this.sequence = 0;
  }
}

/**
 * Derive the execution scope from an event type string.
 */
function deriveScope(eventType: string): ExecutionScope {
  if (eventType.startsWith("feature.")) {
    return "feature";
  }
  if (eventType.startsWith("rule.")) {
    return "rule";
  }
  if (eventType.startsWith("background.")) {
    return "background";
  }
  if (eventType.startsWith("scenarioOutline.")) {
    return "scenarioOutline";
  }
  if (eventType.startsWith("scenario.")) {
    return "scenario";
  }
  if (eventType.startsWith("example.")) {
    return "example";
  }
  if (eventType.startsWith("step.")) {
    return "step";
  }
  if (eventType.startsWith("hook.")) {
    return "hook";
  }
  // Default fallback for unknown event types (e.g. status.changed, error)
  return "step";
}
