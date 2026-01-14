import { EventDispatcher } from "./dispatcher.js";
import { EventEmitter } from "./emitter.js";

export interface EventBus {
  readonly dispatcher: EventDispatcher;
  readonly emitter: EventEmitter;
}

const BUS_KEY = Symbol.for("@autometa/events/bus");

export function getEventBus(): EventBus {
  const store = globalThis as unknown as Record<symbol, EventBus | undefined>;
  const existing = store[BUS_KEY];
  if (existing) {
    return existing;
  }

  const dispatcher = EventDispatcher.create();
  const emitter = new EventEmitter(dispatcher);
  const bus = { dispatcher, emitter } satisfies EventBus;
  store[BUS_KEY] = bus;
  return bus;
}

export function getEventDispatcher(): EventDispatcher {
  return getEventBus().dispatcher;
}

export function getEventEmitter(): EventEmitter {
  return getEventBus().emitter;
}

export function resetEventBus(): void {
  const store = globalThis as unknown as Record<symbol, EventBus | undefined>;
  const existing = store[BUS_KEY];
  if (existing) {
    existing.dispatcher.clear();
  }
  // Avoid relying on `delete` semantics on globalThis in all runtimes/test environments.
  store[BUS_KEY] = undefined;
}
