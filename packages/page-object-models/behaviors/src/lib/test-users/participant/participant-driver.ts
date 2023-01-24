import {
  WebBrowser,
  PageObject,
  WebPage,
  Website,
} from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
import { Participant, See, Will } from '.';
import { Action, AssertionFn, Observation } from '../../behaviors';
import {
  getBrowserMetadata,
  getBrowsesMetadata,
  getRoleMetadata,
} from '../decorators';
import { Participants } from '../focus-group';
import {
  ActionPerformance,
  ObservationPerformance,
  QueueablePerformance,
} from '../performances';
import { AssignActionMethod, SwitchConjunction } from './decorators';
@AssignActionMethod
export class ParticipantDriver {
  constructor(public readonly name: string) {}
  private performances: QueueablePerformance[] = [];
  private status = 'STARTING';
  #coerce<T>() {
    return this as unknown as Participant<T>;
  }

  @SwitchConjunction()
  will<T extends PageObject, K extends PageObject>(
    ...actions: Action<T, K>[]
  ): Participant<Will> {
    for (const action of actions) {
      const performance = new ActionPerformance(action);
      this.performances.push(performance);
    }
    return this.#coerce<Will>();
  }

  @SwitchConjunction()
  see<T extends WebPage | PageObject, K extends PageObject>(
    observer: Class<T> | Observation<T, K>,
    assertion: AssertionFn
  ): Participant<See> {
    const performance = ObservationPerformance.from(observer, assertion);
    this.performances.push(performance);
    return this.#coerce<See>();
  }

  toString() {
    return `Participant { ${this.name} }`;
  }

  valueOf() {
    return this.toString();
  }
  protected *yield() {
    const cached = [...this.performances];
    for (const event of cached) {
      this.performances.shift();
      yield event.performance;
    }
  }
}

export interface TechnicalImplParticipant {
  yield(): Generator<(site: Website) => Promise<unknown>, void, unknown>;
  then(
    onFulfilled?:
      | ((value: unknown) => unknown | PromiseLike<unknown>)
      | undefined
      | null
  ): Promise<unknown | never>;
}

export interface PerformanceExecutor {
  performances: QueueablePerformance[];
}

export function assignPerformance(
  participant: ParticipantDriver | Participant,
  ...performance: QueueablePerformance[]
) {
  const cast = participant as unknown as PerformanceExecutor;
  cast.performances.push(...performance);
}

export function configureParticipant<T extends Participants<T>>(
  participants: T,
  participantsClass: Class<T>,
  participantName: string,
  browser: WebBrowser
): Participant {
  const roleMetadata = getRoleMetadata(participantsClass, participantName);
  const browsesMetadata = getBrowsesMetadata(
    participants.constructor,
    participantName
  );
  const builder = getBrowserMetadata(participantsClass);
  const site = browser.site(browsesMetadata.site, builder);
  const participant = new ParticipantDriver(participantName);
  makeParticipantThenable(participant, site);
  Reflect.defineMetadata('participant:focus-group', participants, participant);
  Reflect.defineMetadata('participant:site', site, participant);
  Reflect.defineMetadata('participant:role', roleMetadata, participant);
  return participant as unknown as Participant;
}

type OnFulfilled =
  | ((value: unknown) => unknown | PromiseLike<unknown>)
  | undefined
  | null;
type OnRejected =
  | ((value: unknown) => unknown | PromiseLike<unknown>)
  | undefined
  | null;


export function makeParticipantThenable(
  participant: Participant | ParticipantDriver,
  site: Website
) {
  async function then(
    onFulfilled?: OnFulfilled,
    onRejected?: OnRejected
  ): Promise<unknown> {
    if (!onFulfilled) {
      return undefined;
    }
    try {
      if (this.status === 'COMPLETE') {
        return throwErrorIfRunTwice.call(this, onRejected);
      }
      for (const event of (this as TechnicalImplParticipant).yield()) {
        await event(site);
      }
      await exitDriverAndMarkComplete.call(this, site);
      await startParticipant.call(this);
      return onFulfilled(undefined);
    } catch (e) {
      console.error(e)
      await site.leave();
      return onRejected(e);
    }
  }
  participant['then'] = then.bind(participant);
}

function startParticipant(this: { status: string }) {
  // await will call the user once before
  // behavior methods like `will` apply. Once
  // the setup behavior has executed, status
  // is changed to "PENDING"
  if (this.status === 'STARTING') {
    this.status = 'PENDING';
  }
}

function throwErrorIfRunTwice(
  this: { status: string },
  onRejected: (value: unknown) => unknown | PromiseLike<unknown>
) {
  const err = new Error(
    `${this} has already completed all actions and cannot be executed again. A Participant should only be "await'd" once.`
  );
  return onRejected(err);
}

async function exitDriverAndMarkComplete(
  this: { status: string },
  site: Website
) {
  if (this.status === 'PENDING') {
    await site.leave();
    this.status = 'COMPLETE';
  }
}

export function getPerformances(
  participant: ParticipantDriver | Participant
): QueueablePerformance[] {
  const { performances } = participant as unknown as {
    performances: QueueablePerformance[];
  };
  return performances;
}
