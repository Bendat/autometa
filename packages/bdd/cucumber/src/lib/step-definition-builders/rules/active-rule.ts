import Category from '../category';

import TestTrackingEvents from '../../tracking/test-tracker';
import { CategoryCallbackObject, RuleInnerCallback } from '../../types';
import { afterAll, beforeAll } from '@jest/globals';
import { Global } from '@jest/types';
import Background from '../backgrounds/background';
import { GherkinRule, GherkinTest } from '@autometa/shared-utilities';

/**
 * Describes a Rule implementation which actively validates
 * and runs its own test. This is the Rule implementation
 * provided by the `Feature` function.
 *
 * When executed, it behaves like a feature, collecting and
 * generating its scenarios/outlines then executing it.
 *
 * ActiveRules cannot be nested. 
 */
export class ActiveRule extends Category {
  readonly title: string;
  #callback: RuleInnerCallback;
  constructor(
    test: GherkinTest,
    parsedRule: GherkinRule,
    callback: RuleInnerCallback,
    events: TestTrackingEvents,
    backgrounds: Background[]
  ) {
    super(test, parsedRule, events);
    this.title = parsedRule.title;
    this.#callback = callback;
    backgrounds.forEach(({ title, stepCallbacks }) =>
      this.registerBackground(title, stepCallbacks)
    );
  }

  execute(
    testGrouping: Global.Describe,
    testFn: Global.It | undefined,
    isSkipped: boolean,
    after = afterAll
  ): void {
    const callbackObject: CategoryCallbackObject = {
      Scenario: this.getScenarioCallback,
      ScenarioOutline: this.getOutlineCallback,
      Background: this.getBackgroundCallback,
    };
    this.#callback(callbackObject);
    const { scenarios, outlines } = this._base;
    testGrouping(`Rule: ${this.title}`, () => {
      if (!isSkipped) {
        beforeAll(() => {
          this._events.ruleStarted(this.title);
        });
        after(() => {
          this._events.ruleEnded();
        });
      }

      this.runScenarios(scenarios, testFn);
      this.runOutlines(outlines, testGrouping, testFn);
    });
  }
}
