import { Component, PageObject, WebPage } from '@autometa/page-components';
import { constructor } from 'tsyringe/dist/typings/types';
import { ActionFn, ObserverFn, ThoughtFn, User } from '.';
import { Action, AssertionFn, Observation, Thought } from '../behaviors';
export interface Performance {
  (): Promise<unknown>;
}
export interface RunningUser<TContext extends ActionFn | ObserverFn | ThoughtFn>
  extends User {
  and: TContext & User;
}
export class QueuedBehavior {
  constructor(
    public behavior:
      | 'sees'
      | 'does'
      | 'thought'
      | 'loads'
      | 'subplot'
      | 'memory',
    public readonly performance: Performance
  ) {}
}

export class ObservationBehavior extends QueuedBehavior {
  constructor(
    public readonly observer: Observation<WebPage, unknown>,
    public readonly assertion: AssertionFn,
    performance: Performance
  ) {
    super('sees', performance);
  }
}

export class ActionBehavior extends QueuedBehavior {
  constructor(
    public readonly action: Action<PageObject, PageObject>,
    performance: Performance
  ) {
    super('does', performance);
  }
}

export class ThoughtBehavior<T extends PageObject> extends QueuedBehavior {
  constructor(
    public readonly page:
      | constructor<T>
      | Observation<T, unknown>
      | undefined,
    public readonly thought: Thought,
    performance: Performance
  ) {
    super('thought', performance);
  }
}

export class MemoryBehavior extends QueuedBehavior {
  constructor(
    public readonly observation: Observation<PageObject, unknown>,
    public readonly value: unknown,
    performance: Performance
  ) {
    super('memory', performance);
  }
}

export class SubPlot extends QueuedBehavior {
  constructor(performance: () => Promise<void>) {
    super('subplot', performance);
  }
}
