import { describe, expect, it } from "vitest";

import type { SimplePickle, SimplePickleFeatureRef, SimplePickleScenarioRef } from "@autometa/gherkin";

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
});

