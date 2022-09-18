import { Env } from '../../setup';
import { GherkinTestValidationError } from '../errors/validation-errors';
import {
  GherkinFeature,
  GherkinRule,
  GherkinScenario,
  GherkinScenarioOutline,
  GherkinTest,
} from '../parsing/gherkin-objects';
import TestTrackingEvents from '../tracking/test-tracker';
import { Steps } from '../types';
import { test, describe } from '@jest/globals';
import { Global } from '@jest/types';
import { matchesFilter } from '../tag-filtering/tag-filtering';
import Background from './backgrounds/background';
import { ScenarioOutline } from './scenario-outline/scenario-outline';
import { Scenario } from './scenario/scenario';
import { di } from '@automaton/dependency-injection';

interface Group<T> {
  [key: string]: T;
}

export default abstract class Category {
  protected _test: GherkinTest;
  protected _base: GherkinFeature | GherkinRule;
  protected _scenarios: Group<Scenario> = {};
  protected _outlines: Group<ScenarioOutline> = {};
  protected _rules: Group<Category> = {};
  protected _backgrounds: Background[] = [];
  protected _events: TestTrackingEvents;

  constructor(
    test: GherkinTest,
    base: GherkinFeature | GherkinRule,
    events: TestTrackingEvents
  ) {
    this._test = test;
    this._events = events;
    this._base = base;
  }

  registerBackground(title: string | undefined, steps: Steps) {
    const background = new Background(title, steps);
    this._backgrounds.push(background);
    return background;
  }

  registerScenario(title: string) {
    const { scenarios, backgrounds } = this._base;
    const search = ({ title: parsed }: GherkinScenario) => parsed === title;
    const found = scenarios.find(search);
    if (!found) {
      throw new GherkinTestValidationError(this._unknownTitle(title));
    }
    const { container } = di();
    const scenario = container
      .resolve(Scenario)
      .configure(title, found, this._backgrounds, backgrounds);
    this._scenarios[title] = scenario;
    return scenario;
  }

  abstract execute(testGrouping: Global.DescribeBase, ...args: unknown[]): void;
  registerScenarioOutline(title: string) {
    const { outlines, backgrounds } = this._base;
    const search = ({ title: parsed }: GherkinScenarioOutline) =>
      parsed === title;
    const found = outlines.find(search);
    if (!found) {
      throw new GherkinTestValidationError(this._unknownTitle(title));
    }
    const scenario = new ScenarioOutline(
      title,
      found,
      this._backgrounds,
      backgrounds,
      this._events
    );
    this._outlines[title] = scenario;
    return scenario;
  }

  getScenarioCallback = (title: string, steps: Steps) => {
    this.registerScenario(title).loadDefinedSteps(steps);
  };

  getOutlineCallback = (title: string, steps: Steps) => {
    this.registerScenarioOutline(title).loadDefinedSteps(steps);
  };

  getBackgroundCallback = (
    title: string | undefined | Steps,
    steps?: Steps
  ) => {
    if (
      (typeof title === typeof 'string' || title === undefined) &&
      steps !== undefined
    ) {
      this.registerBackground(title as unknown as string, steps);
      return;
    }
    this.registerBackground(undefined, title as unknown as Steps);
  };

  protected runOutlines(
    outlines: GherkinScenarioOutline[],
    groupFn?: Global.DescribeBase,
    testFn?: Global.ItBase
  ) {
    for (const { title, tags } of outlines) {
      const matching = this._outlines[title ?? ''];
      if (!matching) {
        throw new GherkinTestValidationError(
          `Could not find a matching Scenario Outline defined for '${title}'`
        );
      }
      const matches = matchesFilter(Env.filterQuery, tags);
      const realGroup = groupFn ?? this._getGroupFunction(matches);
      const realTest = (testFn ??
        this._getTestFunction(matches)) as Global.ItBase;
      matching.execute(realGroup, realTest, this._isSkipped(matches));
    }
  }

  protected runRules(
    rules: GherkinRule[],
    groupFn?: Global.DescribeBase,
    testFn?: Global.ItBase
  ) {
    for (const { title, tags } of rules) {
      const matching = this._rules[title ?? ''];
      if (!matching) {
        throw new GherkinTestValidationError(
          `Could not find a matching Scenario defined for '${title}'`
        );
      }
      const matches = matchesFilter(Env.filterQuery, tags);
      const realTest = testFn ?? this._getTestFunction(matches);
      const realGroup = groupFn ?? this._getGroupFunction(matches);
      matching.execute(realGroup, realTest, this._isSkipped(matches));
    }
  }

  protected runScenarios(scenarios: GherkinScenario[], testFn: Global.ItBase) {
    for (const { title, tags } of scenarios) {
      const matching = this._scenarios[title ?? ''];
      if (!matching) {
        throw new GherkinTestValidationError(
          `Could not find a matching Scenario defined for '${title}'`
        );
      }
      const matches = matchesFilter(Env.filterQuery, tags);
      const realTest = (testFn ??
        this._getTestFunction(matches)) as Global.ItBase;
      matching.execute(realTest, this._isSkipped(matches));
    }
  }

  protected _getTestFunction(matches: boolean) {
    if (!Env.filterQuery) {
      return test;
    }
    return matches ? test : test.skip;
  }

  protected _getGroupFunction(matches: boolean) {
    if (!Env.filterQuery) {
      return describe;
    }
    return matches ? describe : describe.skip;
  }

  protected _isSkipped(matches: boolean) {
    if (!Env.filterQuery) {
      return false;
    }
    return !matches;
  }
  protected _unknownTitle(title: string): string | undefined {
    const { scenarios, outlines } = this._base;
    const allTitles = scenarios
      .flatMap((it) => it.title)
      .concat(outlines.map((it) => it.title))
      .join('\n*  ');
    return `No scenario found matching title '${title}'. Options are \n ${allTitles}`;
  }
}
