import {
  GherkinBackground,
  GherkinFeature,
  GherkinRule,
  GherkinTest,
} from '@autometa/shared-utilities';
import TestTrackingEvents from '../../tracking/test-tracker';
import { Steps } from '../../types';
import { Global } from '@jest/types';
import Category from '../category';
import { ScenarioOutline } from '../scenario-outline/scenario-outline';
import { Scenario } from '../scenario/scenario';
import { TestGroup } from '../test-group/test-group';
import { PassiveRule } from '../rules/passive-rule';
import { di } from '@autometa/dependency-injection';

export class TopLevelRun extends TestGroup {
  readonly callbacks: Steps[] = [];
  readonly test: GherkinTest;
  readonly scenarios: Scenario[] = [];
  readonly outlines: ScenarioOutline[] = [];
  readonly rules: PassiveRule[] = [];
  readonly #steps: Steps[] = [];
  readonly #events: TestTrackingEvents;

  constructor(test: GherkinTest, step: Steps, events: TestTrackingEvents) {
    super(undefined);
    this.test = test;
    this.#steps.push(step);
    this.#events = events;
  }

  loadDefinedSteps(...callbacks: Steps[]): void {
    callbacks.forEach((it) => this.callbacks.push(it));
  }

  assembleScenarios(
    group: GherkinFeature | GherkinRule = this.test.feature,
    outerBackgrounds: GherkinBackground[] = [],
    parent: TopLevelRun | PassiveRule = this
  ) {
    const { backgrounds, scenarios } = group;
    scenarios.forEach((scenario) => {
      const { container } = di();
      const bgs = [...outerBackgrounds, ...backgrounds];
      const scen = container
        .resolve(Scenario)
        .configure(scenario.title ?? '', scenario, [], bgs);

      scen.loadDefinedSteps(...this.#steps);
      parent.scenarios.push(scen);
    });
  }
  assembleScenarioOutlines(
    group: GherkinFeature | GherkinRule = this.test.feature,
    outerBackgrounds: GherkinBackground[] = [],
    parent: TopLevelRun | PassiveRule = this
  ) {
    const { backgrounds, outlines } = group;
    outlines.forEach((outlines) => {
      const scen = new ScenarioOutline(
        outlines.title,
        outlines,
        [],
        [...outerBackgrounds, ...backgrounds],
        this.#events
      );
      scen.loadDefinedSteps(...this.#steps);
      parent.outlines.push(scen);
    });
  }

  assembleScenarioRules() {
    const { backgrounds, rules } = this.test.feature;
    rules.forEach((rule) => {
      const bg = [...backgrounds, ...rule.backgrounds];
      const pRule = new PassiveRule(rule.title, this.callbacks, this.#events);
      this.assembleScenarios(rule, bg, pRule);
      this.assembleScenarioOutlines(rule, bg, pRule);
      this.rules.push(pRule);
    });
  }

  execute(testGroupFn: Global.Describe, testFn: Global.It) {
    for (const scenario of this.scenarios) {
      scenario.loadDefinedSteps(...this.#steps);
    }
    for (const outlines of this.outlines) {
      outlines.loadDefinedSteps(...this.#steps);
    }
    const category = new TopLevelCategory(
      this.test,
      this.scenarios,
      this.outlines,
      this.rules,
      this.#events
    );
    category.execute(testGroupFn, testFn);

    return (
      this.scenarios.length +
      this.outlines.length +
      this.rules
        .flatMap((it) => it.scenarios.length + it.outlines.length)
        .reduce((partialSum, a) => partialSum + a, 0)
    );
  }

  protected _findMatch = (..._: unknown[]) => {
    throw new Error(
      'TopLevelRun should not search for a match. Use a scenario. Also you should never see this.'
    );
  };
}

class TopLevelCategory extends Category {
  constructor(
    test: GherkinTest,
    scenarios: Scenario[],
    outlines: ScenarioOutline[],
    rules: PassiveRule[],
    events: TestTrackingEvents
  ) {
    super(test, test.feature, events);
    scenarios.forEach((it) => (this._scenarios[it.title] = it));
    outlines.forEach((it) => (this._outlines[it.title] = it));
    rules.forEach((it) => (this._rules[it.title] = it));
  }
  execute(testGrouping: Global.Describe, testFn: Global.It): void {
    this.runRules(this._test.feature.rules, testGrouping, testFn);
    this.runOutlines(this._test.feature.outlines, testGrouping, testFn);
    this.runScenarios(this._test.feature.scenarios, testFn);
  }
}
