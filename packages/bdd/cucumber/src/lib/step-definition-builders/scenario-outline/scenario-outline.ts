import { di } from '@autometa/dependency-injection';
import { GherkinBackground, GherkinScenarioOutline } from '@autometa/shared-utilities';
import { afterAll, beforeAll } from '@jest/globals';
import { Global } from '@jest/types';

import TestTrackingEvents from '../../tracking/test-tracker';
import { Steps } from '../../types';
import Background from '../backgrounds/background';
import { Scenario } from '../scenario/scenario';

export class ScenarioOutline {
  #parsedScenarioOutline: GherkinScenarioOutline;
  #parsedBackgrounds: GherkinBackground[];
  #scenarios: Scenario[] = [];
  #backgrounds: Background[];
  #events: TestTrackingEvents;

  constructor(
    public readonly title: string,
    parsedScenarioOutline: GherkinScenarioOutline,
    backgrounds: Background[],
    parsedBackgrounds: GherkinBackground[] = [],
    events: TestTrackingEvents
  ) {
    this.#parsedScenarioOutline = parsedScenarioOutline;
    this.#backgrounds = backgrounds;
    this.#parsedBackgrounds = parsedBackgrounds;
    this.#events = events;
    this.#buildScenarios();
  }

  loadDefinedSteps(...callbacks: Steps[]) {
    for (const scenario of this.#scenarios) {
      callbacks.forEach((callback) => {
        callback(scenario, scenario.Store);
      });
    }
  }

  execute(
    group: Global.Describe,
    testFn: Global.It,
    isSkipped = false,
    after = afterAll,
    before = beforeAll
  ) {
    group(`Scenario Outline: ${this.title}`, () => {
      if (!isSkipped) {
        before(() => {
          this.#events.scenarioOutlineStarted(this.title);
        });
        after(() => {
          this.#events.scenarioOutlineEnded();
        });
      }

      this.#scenarios.map((scenario) => {
        scenario.execute(testFn);
      });
    });
  }

  #buildScenarios() {
    const { scenarios } = this.#parsedScenarioOutline;
    const bg = this.#parsedBackgrounds;
    scenarios
      .map((it) => {
        const { container } = di();
        return container
          .resolve(Scenario)
          .configure(it.title ?? '', it, this.#backgrounds, bg);
      })
      .forEach((it) => this.#scenarios.push(it));
  }
}
