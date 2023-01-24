import { GherkinStep } from '@autometa/shared-utilities';
import { PreparedStepData, StepData } from '../../types';

export class StepCache {
  [key: string]: PreparedStepData[] | unknown;
  Given: StepData[] = [];
  When: StepData[] = [];
  Then: StepData[] = [];
  Targets: Set<unknown> = new Set();
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
    if (['And', 'But', '*'].includes(step.keyword)) {
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
