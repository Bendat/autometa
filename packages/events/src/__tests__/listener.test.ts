import { describe, expect, it } from "vitest";

import type { SimplePickle, SimplePickleFeatureRef, SimplePickleScenarioRef } from "@autometa/gherkin";
import { createContainer, createToken } from "@autometa/injection";

import { EventDispatcher } from "../dispatcher.js";
import { EventEmitter } from "../emitter.js";
import { registerTestListener } from "../listener.js";

describe("registerTestListener", () => {
  it("invokes onEvent and type-specific handlers", async () => {
    const dispatcher = new EventDispatcher();
    const emitter = new EventEmitter(dispatcher, {
      createId: () => "event-id",
      now: () => 123,
    });

    const feature: SimplePickleFeatureRef = {
      id: "feature-1",
      name: "Feature",
      location: { line: 1, column: 1 },
      tags: [],
      comments: [],
    };

    const scenario: SimplePickleScenarioRef = {
      id: "scenario-1",
      name: "Scenario",
      location: { line: 2, column: 1 },
      tags: [],
      comments: [],
      type: "scenario",
    };

    const pickle: SimplePickle = {
      id: "pickle-1",
      name: scenario.name,
      language: "en",
      steps: [],
      tags: [],
      uri: "feature.feature",
      feature,
      scenario,
    };

    const calls: string[] = [];
    const unsubscribe = registerTestListener({
      onEvent({ event }) {
        calls.push(`event:${event.type}`);
      },
      onScenarioStarted({ event }) {
        calls.push(`scenario:${event.scenario.id}`);
      },
    }, { dispatcher });

    await emitter.scenarioStarted({ feature, scenario, pickle });

    unsubscribe();
    await emitter.scenarioStarted({ feature, scenario, pickle });

    expect(calls).toEqual([
      "event:scenario.started",
      "scenario:scenario-1",
    ]);
  });

  it("passes tags and resolve() through to listener callbacks", async () => {
    const container = createContainer();
    const MESSAGE = createToken<string>("@autometa/events/test/message");
    container.registerValue(MESSAGE, "hello");

    const dispatcher = new EventDispatcher(container);
    const emitter = new EventEmitter(dispatcher, {
      createId: () => "event-id",
      now: () => 123,
    });

    const feature: SimplePickleFeatureRef = {
      id: "feature-1",
      name: "Feature",
      location: { line: 1, column: 1 },
      tags: [],
      comments: [],
    };

    const scenario: SimplePickleScenarioRef = {
      id: "scenario-1",
      name: "Scenario",
      location: { line: 2, column: 1 },
      tags: [],
      comments: [],
      type: "scenario",
    };

    const pickle: SimplePickle = {
      id: "pickle-1",
      name: scenario.name,
      language: "en",
      steps: [],
      tags: [],
      uri: "feature.feature",
      feature,
      scenario,
    };

    const received: Array<{ kind: string; tags: string[]; resolved: string }> = [];
    const unsubscribe = registerTestListener(
      {
        onEvent({ event, tags, resolve }) {
          received.push({ kind: `event:${event.type}`, tags, resolved: resolve(MESSAGE) });
        },
        onScenarioStarted({ tags, resolve }) {
          received.push({ kind: "scenario.started", tags, resolved: resolve(MESSAGE) });
        },
      },
      { dispatcher }
    );

    await emitter.scenarioStarted({ feature, scenario, pickle, tags: ["@smoke", "billing"] });

    unsubscribe();
    await emitter.scenarioStarted({ feature, scenario, pickle, tags: ["@ignored"] });

    expect(received).toEqual([
      { kind: "event:scenario.started", tags: ["@smoke", "billing"], resolved: "hello" },
      { kind: "scenario.started", tags: ["@smoke", "billing"], resolved: "hello" },
    ]);
  });
});

