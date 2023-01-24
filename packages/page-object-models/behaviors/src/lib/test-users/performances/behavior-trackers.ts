import { PageObject, WebPage } from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
import { ActionFn, ObserverFn, ThoughtFn, User } from '..';
import { Action, AssertionFn, Observation, Thought } from '../../behaviors';
export interface Performance {
  (): Promise<unknown>;
}
export interface RunningUser<TContext extends ActionFn | ObserverFn | ThoughtFn>
  extends User {
  and: TContext & User;
}
// public behavior:
// | 'sees'
// | 'does'
// | 'thought'
// | 'loads'
// | 'subplot'
// | 'memory',
export abstract class QueuedBehavior {
  abstract readonly behavior: string;
  constructor(public readonly performance: Performance) {}
}

export class ObservationBehavior extends QueuedBehavior {
  readonly behavior = 'sees';

  constructor(
    public readonly observer: Observation<WebPage, unknown>,
    public readonly assertion: AssertionFn,
    performance: Performance
  ) {
    super(performance);
  }
}

export class ActionBehavior extends QueuedBehavior {
  readonly behavior = 'does';

  constructor(
    public readonly action: Action<PageObject, PageObject>,
    performance: Performance
  ) {
    super(performance);
  }
}

export class ThoughtBehavior<T extends PageObject> extends QueuedBehavior {
  readonly behavior = 'thinks';

  constructor(
    public readonly page: Class<T> | Observation<T, unknown> | undefined,
    public readonly thought: Thought,
    performance: Performance
  ) {
    super(performance);
  }
}

export class MemoryBehavior extends QueuedBehavior {
  readonly behavior = 'remembers';

  constructor(
    public readonly observation: Observation<PageObject, unknown>,
    public readonly value: unknown,
    performance: Performance
  ) {
    super(performance);
  }
}

export class SubPlot extends QueuedBehavior {
  readonly behavior = 'sees';

  constructor(performance: () => Promise<void>) {
    super(performance);
  }
}
