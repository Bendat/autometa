import {
  Component,
  PageObject,
  UntilCondition,
  WebPage,
} from '@autometa/page-components';
import { Observation } from './observation';

export type TimeUnitTransformer = (num: number) => number;

export function MilliSeconds(count: number) {
  return count;
}
export function Seconds(count: number) {
  return count * 1000;
}
export function Minutes(count: number) {
  return Seconds(count) * 60;
}
export function Hours(count: number) {
  return Minutes(count) * 60;
}

export abstract class Thought {}

export class ThoughtAbout<T extends PageObject, K> extends Thought {
  constructor(
    public readonly object: Observation<T, K | undefined>,
    public readonly until: UntilCondition,
    public readonly duration: ThoughtFor,
    public readonly args: (string | RegExp)[]
  ) {
    super();
    this.object.select;
  }
}

export class ThoughtFor extends Thought {
  constructor(
    public readonly time: number,
    public readonly timeUnit: TimeUnitTransformer
  ) {
    super();
  }
  get milliseconds() {
    return this.timeUnit(this.time);
  }
}

export function About<T extends WebPage, K extends Component>(
  type: Observation<T, K | undefined>,
  until: UntilCondition,
  ...args: (string | RegExp | ThoughtFor)[]
): ThoughtAbout<T, K> {
  const timeout =
    (args.find((it) => it instanceof ThoughtFor) as ThoughtFor) ??
    For(2, Seconds);
  const actualArgs = args.filter((it) => !(it instanceof ThoughtFor)) as (
    | string
    | RegExp
  )[];
  return new ThoughtAbout(type, until, timeout, actualArgs);
}

export function For(
  time: number,
  timeUnit: TimeUnitTransformer = MilliSeconds
): ThoughtFor {
  return new ThoughtFor(time, timeUnit);
}
