/**
 * Event dispatcher for Autometa lifecycle events.
 */
import {
  createContainer,
  createToken,
  Scope,
  type IContainer,
} from "@autometa/injection";
import type { EventEnvelope, EventSubscriber, TestEvent } from "./types.js";

export interface EventDispatcherOptions {
  /**
   * Optional container to use for resolving subscribers. If omitted a
   * standalone container is created per dispatcher instance.
   */
  container?: IContainer;
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
  async dispatch<T extends TestEvent>(event: T): Promise<void> {
    const envelope: EventEnvelope<T> = {
      sequence: ++this.sequence,
      event,
      resolve: (token) => this.container.resolve(token),
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
