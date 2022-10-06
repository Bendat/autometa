import { Component, PageObject, WebPage } from '@autometa/page-components';
import { constructor } from 'tsyringe/dist/typings/types';
import { ActionFn, ObserverFn, ThoughtFn, User } from '.';
import { Action, AssertionFn, Observation, Thought } from '../behaviors';

export interface RunningUser<TContext extends ActionFn | ObserverFn | ThoughtFn>
  extends User {
  and: TContext & User;
}
export class QueuedBehavior {
  constructor(
    public behavior: 'sees' | 'does' | 'thought' | 'loads' | 'subplot',
    public readonly performance: () => Promise<unknown>
  ) {}
}

export class ObservationBehavior extends QueuedBehavior {
  constructor(
    public readonly observer: Observation<WebPage, unknown>,
    public readonly assertion: AssertionFn,
    performance: () => Promise<void>
  ) {
    super('sees', performance);
  }
}

export class ActionBehavior extends QueuedBehavior {
  constructor(
    public readonly action: Action<PageObject, PageObject>,
    performance: () => Promise<void>
  ) {
    super('does', performance);
  }
}

export class ThoughtBehavior<T extends WebPage> extends QueuedBehavior {
  constructor(
    public readonly page: constructor<T> | undefined,
    public readonly thought: Thought,
    performance: () => Promise<void>
  ) {
    super('thought', performance);
  }
}

export class SubPlot extends QueuedBehavior {
  constructor(performance: () => Promise<void>) {
    super('subplot', performance);
  }
}
