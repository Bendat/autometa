import 'reflect-metadata';
import { Component, WebPage, Website } from '@autometa/page-components';
import { Observation } from '../../behaviors/observation';
import {
  ObservationPerformance,
  ObserverPerformance,
  ObserveWebpagePerformance,
} from './observation-performance';
import { Class } from '@autometa/shared-utilities';
jest.mock('@autometa/page-components', () => {
  return {
    WebPage: jest.fn().mockImplementation(() => {
      return Object.create(WebPage.prototype);
    }),
    Component: jest.fn().mockImplementation(() => {
      return Object.create(Component.prototype);
    }),
    Website: jest.fn().mockImplementation(() => {
      return Object.create(Website.prototype, {
        switch: {
          value: jest.fn(),
        },
      });
    }),
  };
});
jest.mock('../../behaviors/observation', () => {
  return {
    Observation: jest.fn().mockImplementation(() => {
      return Object.create(Observation.prototype, {
        selector: {
          value: jest.fn(),
        },
        select: {
          value: jest.fn().mockReturnValue(2),
        },
      });
    }),
  };
});

const mockedWebPage = jest.mocked(WebPage, true);
const MockedWebPage = mockedWebPage as unknown as Class<WebPage>;
const mockedWebsite = jest.mocked(Website, true);
const MockedWebsite = mockedWebsite as unknown as Class<Website>;
const mockedObservation = jest.mocked(Observation, false);
const MockedObservation = mockedObservation as unknown as Class<
  Observation<WebPage, Component>
>;
describe('Observational Performance', () => {
  describe('factory', () => {
    it('should create the correct performance for a WebPage', () => {
      const assertion = jest.fn();
      const performance = ObservationPerformance.from(MockedWebPage, assertion);
      expect(performance).toBeInstanceOf(ObserveWebpagePerformance);
    });
    it('should create the correct performance for an Observation', () => {
      const assertion = jest.fn();
      const observation = new MockedObservation();
      const performance = ObservationPerformance.from(observation, assertion);
      expect(performance).toBeInstanceOf(ObserverPerformance);
    });
  });
  it('should select a Page Component value from an Observation Performance and assert against it', async () => {
    const site = new MockedWebsite();
    const assertion = jest.fn();
    const observation = new MockedObservation();
    const performance = new ObserverPerformance(observation, assertion);
    await performance.performance(site);
    expect(assertion).toBeCalledWith(2);
  });

  it('should select a Page Component value from an Observe Webpage Performance and assert against it', async () => {
    const site = new MockedWebsite();
    const assertion = jest.fn();
    const performance = new ObserveWebpagePerformance(MockedWebPage, assertion);
    await performance.performance(site);
    expect(assertion).toHaveBeenCalled();
    expect(site.switch).toHaveBeenCalledWith(MockedWebPage);
  });
});
