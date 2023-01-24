import { PageObject, WebPage, Website } from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
import { Action, ActionOn } from './action';
import { Observation } from './observation';
jest.mock('./observation', () => {
  const observation = () => {
    return Object.create(Observation.prototype, {
      select: {
        value: jest.fn(),
        writable: true,
      },
    });
  };

  return {
    Observation: jest.fn().mockImplementation(observation),
  };
});
jest.mock('@autometa/page-components', () => {
  return {
    Website: jest.fn().mockImplementation(() => {
      return Object.create(Website.prototype);
    }),
    WebPage: jest.fn().mockImplementation(() => {
      return Object.create(WebPage.prototype);
    }),
  };
});

const mockedObservation = jest.mocked(Observation, true);
const MockedObservation = mockedObservation as unknown as Class<
  Observation<WebPage, PageObject>
>;
const mockedWebsite = jest.mocked(Observation, true);
const MockedWebsite = mockedWebsite as unknown as Class<Website>;
const mockedWebPage = jest.mocked(WebPage, true);
const MockedWebPage = mockedWebPage as unknown as Class<WebPage>;

describe('Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Construction', () => {
    it('should build an observer when constructed', () => {
      const observer = new MockedObservation();
      const actionCallback = jest.fn();
      Observation.wrapOrReturn = jest.fn().mockReturnValue(observer);
      const action = new Action(observer, actionCallback);
      expect(action.target).toEqual(observer);
      expect(Observation.wrapOrReturn).toHaveBeenCalled();
    });
  });

  describe('Execution', () => {
    it('should execute an action on an observation', async () => {
      const observer = new MockedObservation();
      observer.select = jest.fn().mockReturnValue(observer);
      const actionCallback = jest.fn();
      Observation.wrapOrReturn = jest.fn().mockReturnValue(observer);
      const website = new MockedWebsite();
      const action = new Action(observer, actionCallback);
      await action.execute(website);
      expect(actionCallback).toHaveBeenCalledWith(observer);
      expect(observer.select).toHaveBeenCalledWith(website);
    });
  });
});

describe('Factory function', () => {
  it('should create an action with ActionOn and a webpage', async () => {
    const observer = new MockedObservation();
    const actionCallback = jest.fn();
    Observation.wrapOrReturn = jest.fn().mockReturnValue(observer);

    const action = ActionOn(MockedWebPage, actionCallback);
    expect(action.action).toEqual(actionCallback);
    expect(action.target).toEqual(observer);
    expect(Observation.wrapOrReturn).toHaveBeenCalledWith(MockedWebPage);
  });
  it('should create an action with ActionOn and an Observer', async () => {
    const observer = new MockedObservation();
    const actionCallback = jest.fn();
    Observation.wrapOrReturn = jest.fn().mockReturnValue(observer);

    const action = ActionOn(observer, actionCallback);
    expect(action.action).toEqual(actionCallback);
    expect(action.target).toEqual(observer);
  });
});
