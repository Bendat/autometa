import { Constructor, getCallerFromIndex } from '@autometa/shared-utilities';
import {
  GherkinFeature,
  GherkinStep,
  GherkinTest,
} from '../../parsing/gherkin-objects';
import TestTrackingSubscribers from '../../tracking/test-subscribers';
import TestTrackingEvents from '../../tracking/test-tracker';

import { PreparedStepCallback, PreparedStepData } from '../../types';
import { readFeature } from '../../utils';
import { FeatureRun } from '../feature/feature-run';
import { TopLevelRun } from '../top-level-run';
export class StepCache {
  [key: string]: PreparedStepData[] | unknown;
  Given: PreparedStepData[] = [];
  When: PreparedStepData[] = [];
  Then: PreparedStepData[] = [];
  Targets: Set<Constructor<unknown>> = new Set();
  findStep = (groupName: string, step: GherkinStep) => {
    const group: PreparedStepData[] = this.#getGroup(step, groupName);
    for (const loadedStep of group) {
      if (loadedStep?.regex) {
        continue;
      }
      if (step.text === loadedStep?.text) {
        return loadedStep;
      }
    }
  };

  #getGroup(step: GherkinStep, groupName: string): PreparedStepData[] {
    let group: PreparedStepData[];
    if (step.keyword in ['And', 'But', '*']) {
      group = [...this.Given, ...this.When, ...this.Then];
    } else {
      group = this[groupName] as unknown as PreparedStepData[];
    }
    return group;
  }
}

/**
 * You don't want to use this directly. Leave this place.
 */
export const globalCache = new StepCache();

export class GlobalCacheAssembler {
  assembleFeature(pathToFeature: string) {
    const gf: GherkinTest = readFeature(pathToFeature, getCallerFromIndex(2));
    const run = new TopLevelRun(
      gf,
      ({ Given, When, Then }) => {
        globalCache.Given.forEach(({ action, text, regex }) => {
          Given.global(regex ?? text, action);
        });
        globalCache.When.forEach(({ action, text, regex }) => {
          When.global(regex ?? text, action);
        });
        globalCache.Then.forEach(({ action, text, regex }) => {
          Then.global(regex ?? text, action);
        });
      },
      new TestTrackingEvents(new TestTrackingSubscribers())
    );
    run.assembleScenarios();
     run.assembleScenarioOutlines();
    run.assembleScenarioRules();
    describe(`Feature: ${gf.feature.title}`, () => {
      run.execute(describe, it);
    });
  }
}
export function Given(
  stepString: string | RegExp,
  action: PreparedStepCallback
) {
  let text: string;
  let regex: RegExp | undefined;
  if (stepString instanceof RegExp) {
    text = stepString.source;
    regex = stepString;
  } else {
    text = stepString;
  }
  const step: PreparedStepData = {
    text,
    regex,
    action,
    isGlobal: true

  };
  globalCache.Given.push(step);
}
export function When(
  stepString: string | RegExp,
  action: PreparedStepCallback
) {
  let text: string;
  let regex: RegExp | undefined;
  if (stepString instanceof RegExp) {
    text = stepString.source;
    regex = stepString;
  } else {
    text = stepString;
  }
  const step: PreparedStepData = {
    text,
    regex,
    action,
    isGlobal: true

  };

  globalCache.When.push(step);
}

export function Then(
  stepString: string | RegExp,
  action: PreparedStepCallback
) {
  let text: string;
  let regex: RegExp | undefined;
  if (stepString instanceof RegExp) {
    text = stepString.source;
    regex = stepString;
  } else {
    text = stepString;
  }
  const step: PreparedStepData = {
    text,
    regex,
    action,
    isGlobal: true
  };
  globalCache.Then.push(step);
}
