import 'reflect-metadata';
import {
  WebBrowser,
  PageObject,
  WebPage,
  Website,
} from '@autometa/page-components';
import { Action, Observation } from '../../behaviors';
import {
  ActionPerformance,
  ObservationPerformance,
  ObserverPerformance,
  ObserveWebpagePerformance,
} from '../performances';
import {
  configureParticipant,
  getPerformances,
  makeParticipantThenable,
  ParticipantDriver,
  TechnicalImplParticipant,
} from './participant-driver';
import { Class } from '@autometa/shared-utilities';
import { Participant } from './types';
import { Browses, Role } from '../..';
import { URL } from 'url';
const siteUrl = new URL('http://localhost');

jest.mock('../../behaviors', () => {
  const observation = () => {
    return Object.create(Observation.prototype, {
      select: {
        value: jest.fn(),
      },
    });
  };
  const action = () => {
    return Object.create(Action.prototype, {
      execute: {
        value: jest.fn(),
      },
    });
  };
  return {
    Action: jest.fn().mockImplementation(action),
    Observation: jest.fn().mockImplementation(observation),
  };
});
jest.mock('@autometa/page-components', () => {
  return {
    WebPage: jest.fn().mockImplementation(() => {
      return Object.create(WebPage.prototype);
    }),
    Website: jest.fn().mockImplementation(() => {
      return Object.create(Website.prototype);
    }),
    WebBrowser: jest.fn().mockImplementation(() => {
      return Object.create(WebBrowser.prototype, {
        site: {
          value: jest.fn().mockReturnValue(siteUrl),
        },
      });
    }),
  };
});
const mockedObservation = jest.mocked(Observation, true);
const MockedObservation = mockedObservation as unknown as Class<
  Observation<WebPage, PageObject>
>;
const mockedWebPage = jest.mocked(WebPage, true);
const MockedWebPage = mockedWebPage as unknown as Class<WebPage>;
const mockedAction = jest.mocked(Action, true);
const MockedAction = mockedAction as unknown as Class<
  Action<WebPage, PageObject>
>;
afterEach(() => {
  jest.clearAllMocks();
});
describe('ParticipantDriver', () => {
  it('should convert a participant to a string', () => {
    const sut = new ParticipantDriver('TestUser');
    expect(sut.toString()).toEqual('Participant { TestUser }');
  });
  it('should convert a participant to value', () => {
    const sut = new ParticipantDriver('TestUser');
    expect(sut.valueOf()).toEqual('Participant { TestUser }');
  });
  describe('Observation Performances', () => {
    describe('Observer performance', () => {
      it('should have a performance for an observation pending', () => {
        const observation: Observation<WebPage, PageObject> =
          new MockedObservation();

        const sut = new ParticipantDriver('TestUser');
        const assertion = jest.fn();
        sut.see(observation, assertion);
        const performances = getPerformances(sut) as Array<
          ObserverPerformance<WebPage, PageObject>
        >;
        const capturedObservers = performances.map(({ observer }) => observer);
        expect(capturedObservers).toEqual([observation]);
      });
      describe('Observer Conjunction', () => {
        it('should have two performances for an observation pending', () => {
          const observation: Observation<WebPage, PageObject> =
            new MockedObservation();

          const sut = new ParticipantDriver('TestUser');
          const assertion = jest.fn();
          sut.see(observation, assertion).and(observation, assertion);
          const performances = getPerformances(sut) as Array<
            ObserverPerformance<WebPage, PageObject>
          >;
          const capturedObservers = performances.map(
            ({ observer }) => observer
          );
          expect(capturedObservers).toEqual([observation, observation]);
        });
      });
    });
    describe('Webpage performance', () => {
      it('should have a performance to see a Webpage element', () => {
        const sut = new ParticipantDriver('TestUser');
        const assertion = jest.fn();
        sut.see(MockedWebPage, assertion);
        const performances = getPerformances(sut) as Array<
          ObserveWebpagePerformance<WebPage>
        >;
        const capturedObservers = performances.map(({ webpage }) => webpage);
        expect(capturedObservers).toEqual([MockedWebPage]);
      });
      describe('Observe Webpage Conjunction', () => {
        it('should have two performances for a Web Page observation pending', () => {
          const sut = new ParticipantDriver('TestUser');
          const assertion = jest.fn();
          sut.see(MockedWebPage, assertion).and(MockedWebPage, assertion);

          const performances = getPerformances(sut) as Array<
            ObserveWebpagePerformance<WebPage>
          >;
          const [see, and] = performances.flatMap(({ webpage }) => webpage);
          expect(see.prototype).toEqual(MockedWebPage.prototype);
          expect(and.prototype).toEqual(MockedWebPage.prototype);
          expect(and.prototype).not.toBeUndefined();
        });
      });
    });
  });
  describe('Action Performances', () => {
    let action: Action<WebPage, PageObject>;
    afterEach(() => {
      jest.clearAllMocks();
      action = new MockedAction();
    });
    it('should have a performance for an observation pending', () => {
      const sut = new ParticipantDriver('TestUser');
      sut.will(action);
      const performances = getPerformances(sut) as Array<
        ActionPerformance<WebPage, PageObject>
      >;
      const capturedObservers = performances.map(({ action }) => action);
      expect(capturedObservers).toEqual([action]);
    });
    it('should have two performance for an action pending', () => {
      const sut = new ParticipantDriver('TestUser');
      sut.will(action, action);
      const performances = getPerformances(sut) as Array<
        ActionPerformance<WebPage, PageObject>
      >;
      const capturedObservers = performances.map(({ action }) => action);
      expect(capturedObservers).toEqual([action, action]);
    });
    describe('Action Conjunction', () => {
      it('should have two performances for an action pending from a conjunction', () => {
        const sut = new ParticipantDriver('TestUser');
        sut.will(action).and(action);
        const performances = getPerformances(sut) as Array<
          ActionPerformance<WebPage, PageObject>
        >;
        const capturedObservers = performances.map(({ action }) => action);
        expect(capturedObservers).toEqual([action, action]);
      });
    });
  });

  describe('Context switching', () => {
    let action: Action<WebPage, PageObject>;
    let observation: Observation<WebPage, PageObject>;
    beforeEach(() => {
      action = new MockedAction();
      observation = new MockedObservation();
    });
    it('should switch between action and observation', () => {
      const sut = new ParticipantDriver('TestUser');
      const assertion = jest.fn();
      sut.will(action).see(observation, assertion); //.see(observation, assertion);
      const performances = getPerformances(sut) as Array<
        ActionPerformance<WebPage, PageObject> | ObservationPerformance
      >;
      const captured = performances.map((it) => {
        return (
          (it as ObserverPerformance<WebPage, PageObject>).observer ??
          (it as ActionPerformance<WebPage, PageObject>).action
        );
      });
      expect(captured).toEqual([action, observation]);
    });

    it('should compound an action and observation chain', () => {
      const sut: Participant = new ParticipantDriver(
        'TestUser'
      ) as unknown as Participant;
      const assertion = jest.fn();
      sut.will
        .see(observation, assertion)
        .and(observation, assertion)
        .and.will(action)
        .and(action);
      const performances = getPerformances(sut) as Array<
        ActionPerformance<WebPage, PageObject> | ObservationPerformance
      >;
      const captured = performances.map((it) => {
        return (
          (it as ObserverPerformance<WebPage, PageObject>).observer ??
          (it as ActionPerformance<WebPage, PageObject>).action
        );
      });
      expect(captured).toEqual([observation, observation, action, action]);
    });
  });
  describe('Executing the participants performance', () => {
    const mockedObservation = jest.mocked(Observation, true);
    const MockedObservation = mockedObservation as unknown as Class<
      Observation<WebPage, PageObject>
    >;
    const mockedAction = jest.mocked(Action, true);
    const MockedAction = mockedAction as unknown as Class<
      Action<WebPage, PageObject>
    >;
    const mockedWebsite = jest.mocked(Website);
    const MockedWebsite = mockedWebsite as unknown as Class<Website>;
    let action: Action<WebPage, PageObject>;
    let observation: Observation<WebPage, PageObject>;
    let website: Website;
    beforeEach(() => {
      action = new MockedAction();
      observation = new MockedObservation();
      website = new MockedWebsite();
    });
    it('should yield the pending performances', async () => {
      const sut: Participant & TechnicalImplParticipant = new ParticipantDriver(
        'TestUser'
      ) as unknown as Participant & TechnicalImplParticipant;
      const assertion = jest.fn();
      sut.will.see(observation, assertion).will(action);

      const performances = [...sut.yield()];
      await Promise.all(
        performances.map(async (performance) => performance(website))
      );
      expect(performances.length).toBe(2);
      expect(observation.select).toHaveBeenCalledTimes(1);
      expect(action.execute).toHaveBeenCalledTimes(1);
    });
    it('should await a Participant, executing their performances', async () => {
      const sut: Participant & TechnicalImplParticipant = new ParticipantDriver(
        'TestUser'
      ) as unknown as Participant & TechnicalImplParticipant;
      makeParticipantThenable(sut, website);
      const assertion = jest.fn();
      await sut.will.see(observation, assertion).will(action);

      expect(observation.select).toHaveBeenCalledTimes(1);
      expect(action.execute).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Configuring a Participant', () => {
  class TestUsers  {
    @Role('Tester')
    @Browses(siteUrl)
    Robert: Participant;
  }

  const mockedBrowser = jest.mocked(WebBrowser, true);
  const MockedBrowser = mockedBrowser as unknown as Class<WebBrowser>;
  it('should configure a participant', async () => {
    const onFulfill = jest.fn();
    const participants = new TestUsers();
    const browser = new MockedBrowser();
    const participant = configureParticipant(
      participants,
      TestUsers,
      'Robert',
      browser
    );
    participants.Robert = participant;
    const group = Reflect.getMetadata('participant:focus-group', participant);
    const role = Reflect.getMetadata('participant:role', participant);
    const site = Reflect.getMetadata('participant:site', participant);
    await participant.then(onFulfill);
    expect(onFulfill).toBeCalledWith(undefined);
    expect(group).toEqual(participants);
    expect(role).toEqual('Tester');
    expect(site).toEqual(siteUrl);
  });
});

