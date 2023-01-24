import TestTrackingEvents from '../../tracking/test-tracker';
import { Steps } from '../../types';
import Category from '../category';
import { ScenarioOutline } from '../scenario-outline/scenario-outline';
import { Scenario } from '../scenario/scenario';
import { Global } from '@jest/types';
import { beforeAll, afterAll } from '@jest/globals';

/**
 * Describes a Rule Implementation which does not actively
 * determine it's own tests. Instead, tests and steps are provided externally,
 * specifically by `TopLevelRun`.
 */
export class PassiveRule extends Category {
  readonly title: string;
  readonly #steps: Steps[];
  public readonly scenarios: Scenario[] = [];
  public readonly outlines: ScenarioOutline[] = [];

  constructor(title: string, steps: Steps[], events: TestTrackingEvents) {
    super(undefined, undefined, events);
    this.title = title;
    this.#steps = steps;
  }

  execute(
    testGroupFn: Global.Describe,
    testFn: Global.It,
    isSkipped = false,
    before = beforeAll,
    after = afterAll
  ) {
    for (const scenario of this.scenarios) {
      scenario.loadDefinedSteps(...this.#steps);
    }

    for (const outline of this.outlines) {
      outline.loadDefinedSteps(...this.#steps);
    }

    testGroupFn(`Rule: ${this.title}`, () => {
      if (!isSkipped) {
        before(() => {
          this._events.ruleStarted(this.title);
        });
        after(() => {
          this._events.ruleEnded();
        });
        this.scenarios.map((scenario) => {
          scenario.execute(testFn);
        });
        this.outlines.map((outline) => {
          outline.execute(testGroupFn, testFn);
        });
      }
    });
  }
}
