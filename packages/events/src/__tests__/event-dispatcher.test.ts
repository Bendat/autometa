import { describe, expect, it } from "vitest";
import { createContainer, createToken } from "@autometa/injection";
import { EventDispatcher, EventDispatcherToken } from "../dispatcher.js";
import type { FeatureLifecycleEvent } from "../types.js";

describe("EventDispatcher", () => {
  const location = { line: 1, column: 1 } as const;
  const feature = {
    id: "feature",
    name: "Feature",
    location,
    tags: [],
    comments: [],
  };

  const createEvent = (id: string, timestamp: number): FeatureLifecycleEvent => ({
    type: "feature.started",
    id,
    timestamp,
    feature,
  });

  it("dispatches events to subscribers and supports unsubscribe", async () => {
    const dispatcher = new EventDispatcher();
    const received: Array<{ id: string; sequence: number }> = [];

    const unsubscribe = dispatcher.subscribe<FeatureLifecycleEvent>(
      "feature.started",
      (envelope) => {
        received.push({ id: envelope.event.id, sequence: envelope.sequence });
      }
    );

    await dispatcher.dispatch(createEvent("first", 1));
    expect(received).toEqual([{ id: "first", sequence: 1 }]);

    unsubscribe();
    await dispatcher.dispatch(createEvent("second", 2));
    expect(received).toHaveLength(1);
  });

  it("exposes container resolve() in the event envelope", async () => {
    const container = createContainer();
    const MESSAGE = createToken<string>("@autometa/events/test/message");
    container.registerValue(MESSAGE, "ok");

    const dispatcher = new EventDispatcher(container);
    const resolved: string[] = [];

    dispatcher.subscribe<FeatureLifecycleEvent>("feature.started", (envelope) => {
      resolved.push(envelope.resolve(MESSAGE));
    });

    await dispatcher.dispatch(createEvent("first", 1));

    expect(resolved).toEqual(["ok"]);
  });

  it("passes tags through to subscribers", async () => {
    const dispatcher = new EventDispatcher();
    const received: string[][] = [];

    dispatcher.subscribe<FeatureLifecycleEvent>("feature.started", (envelope) => {
      received.push(envelope.tags);
    });

    await dispatcher.dispatch(createEvent("tagged", 1), { tags: ["@smoke", "billing"] });
    expect(received).toEqual([["@smoke", "billing"]]);
  });

  it("derives currentScope from event type", async () => {
    const dispatcher = new EventDispatcher();
    const received: string[] = [];

    dispatcher.subscribe<FeatureLifecycleEvent>("feature.started", (envelope) => {
      received.push(envelope.currentScope);
    });

    await dispatcher.dispatch(createEvent("scoped", 1));
    expect(received).toEqual(["feature"]);
  });

  it("clears subscribers and resets sequence", async () => {
    const dispatcher = new EventDispatcher();
    const first: number[] = [];

    dispatcher.subscribe<FeatureLifecycleEvent>("feature.started", (envelope) => {
      first.push(envelope.sequence);
    });

    await dispatcher.dispatch(createEvent("initial", 10));
    expect(first).toEqual([1]);

    dispatcher.clear();
    const second: number[] = [];
    dispatcher.subscribe<FeatureLifecycleEvent>("feature.started", (envelope) => {
      second.push(envelope.sequence);
    });

    await dispatcher.dispatch(createEvent("post", 30));
    expect(second).toEqual([1]);

    await dispatcher.dispatch(createEvent("post-2", 40));
    expect(second).toEqual([1, 2]);
  });

  it("returns when no subscribers are registered", async () => {
    const dispatcher = new EventDispatcher();
    await expect(dispatcher.dispatch(createEvent("lonely", 0))).resolves.toBeUndefined();
  });

  it("registers a singleton instance per container", () => {
    const container = createContainer();
    const first = EventDispatcher.create({ container });
    const second = EventDispatcher.create({ container });

    expect(first).toBe(second);
    const resolved = container.resolve(EventDispatcherToken);
    expect(resolved).toBe(first);
  });
});
