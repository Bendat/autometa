import { PreparedStepCallback, StepData } from '../../types';
import { globalCache } from './global-step-cache';
// import { TopLevelRun } from '../top-level-run';

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
  const step = new StepData(text, regex, action, true);
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
  const step = new StepData(text, regex, action, true);

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
  const step = new StepData(text, regex, action, true);
  globalCache.Then.push(step);
}
