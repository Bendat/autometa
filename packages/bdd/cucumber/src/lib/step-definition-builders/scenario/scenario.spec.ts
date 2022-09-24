import {
  GherkinBackground,
  GherkinScenario,
} from '../../../../../../utils/shared-utilities/src/lib/cucumber/parsing/gherkin-objects';
import {Scenario} from './scenario';
import TestTrackingSubscribers from '../../tracking/test-subscribers';
import TestTrackingEvents from '../../tracking/test-tracker';
import { StepFunctions } from '../../types';
import Background from '../backgrounds/background';
import { Global } from '@jest/types';
import { World, Store } from '@autometa/store';
const world = new World();
const store = new Store();
describe('scenario', () => {
  describe('execute', () => {
    const jestItMock = jest.fn(async (...args) => {
      const [title, action] = args;
      expect(title).toBe('Scenario: test');
      await action();
    });
    afterEach(() => {
      jestItMock.mockClear();
    });
    it('should do nothing when executed without steps', async () => {
      const subscribers = new TestTrackingSubscribers();
      const events = new TestTrackingEvents(subscribers);
      const spy = jest.spyOn(events, 'scenarioStarted');

      const scenario = new GherkinScenario('test', [], undefined, []);
      const sut = new Scenario(world, store, events);
      sut.configure('test', scenario, [], []);

      sut.execute(jestItMock as unknown as Global.ItBase);
      expect(jestItMock).toBeCalledTimes(1);
      // When the test function is called, a scenario
      // started event will execute.
      expect(spy).toBeCalledTimes(1);
      expect.assertions(3);
    });
    const step = {
      keyword: 'Given',
      text: 'a test',
      variables: [],
    };
    describe('with backgrounds', () => {
      it('should run background steps', () => {
        const subscribers = new TestTrackingSubscribers();
        const events = new TestTrackingEvents(subscribers);

        const scenario = new GherkinScenario('test', [], undefined, []);
        const innerCbMockFn = jest.fn();
        const cb = ({ Given }: StepFunctions) => {
          Given('a test', innerCbMockFn);
        };
        const background = new Background('', cb);
        const rawBackground = new GherkinBackground('', [step]);
        const sut = new Scenario(world, store, events);
        sut.configure('test', scenario, [background], [rawBackground]);
        sut.execute(jestItMock as unknown as Global.It);
        expect(jestItMock).toBeCalledTimes(1);
        expect(sut.steps.Given['a test'].action).toBeCalledTimes(1);
        expect(innerCbMockFn).toHaveBeenCalledTimes(1);
        expect.assertions(4);
      });

      it('should run scenario steps from background', async () => {
        const subscribers = new TestTrackingSubscribers();
        const events = new TestTrackingEvents(subscribers);
        const scenario = new GherkinScenario('test', [step], undefined, []);
        // mocks not playing nice here (due to async?)
        // the async callback is normally handled by jest
        // itself but here it is not.
        let stepExecuted = false;
        let testExecuted = false;
        const cb = ({ Given }: StepFunctions) => {
          Given('a test', () => {
            stepExecuted = true;
          });
        };
        const background = new Background('', cb);

        const sut = new Scenario(world, store, events);
        sut.configure('test', scenario, [background], []);

        const testFn = (_: string, fn: (...args: unknown[]) => unknown) => {
          testExecuted = true;
          return fn();
        };
        await sut.execute(testFn as unknown as Global.ItBase);
        expect(stepExecuted).toBe(true);
        expect(testExecuted).toBe(true);
      });
    });
    describe('just scenario steps', () => {
      it('should run scenario steps', async () => {
        const subscribers = new TestTrackingSubscribers();
        const events = new TestTrackingEvents(subscribers);
        const scenario = new GherkinScenario('test', [step], undefined, []);
        // mocks not playing nice here (due to async?)
        // the async callback is normally handled by jest
        // itself but here it is not.
        // booles as a "temporary" workaround.
        let stepExecuted = false;
        let testExecuted = false;
        const sut = new Scenario(world, store, events);
        sut.configure('test', scenario, [], []);
        const { Given } = sut;
        Given('a test', () => {
          stepExecuted = true;
        });
        const testFn = (_: string, fn: () => void) => {
          testExecuted = true;
          return fn();
        };
        await sut.execute(testFn as unknown as Global.ItBase);
        expect(stepExecuted).toBe(true);
        expect(testExecuted).toBe(true);
      });
    });
  });
});
