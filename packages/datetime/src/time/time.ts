import { TimeDiff, type TimeDiffFn } from "./time-diff.js";

export interface TimeFactory {
  readonly diff: TimeDiff;
}

class TimeFacade implements TimeFactory {
  readonly diff: TimeDiff;

  constructor(diff: TimeDiff) {
    this.diff = diff;
  }
}

export function createTime(): TimeFactory {
  return new TimeFacade(new TimeDiff());
}

export const Time = createTime();
export { TimeDiff, type TimeDiffFn };
