import { ScenarioOutline } from './scenario-outline';
import TestTrackingSubscribers from '../../tracking/test-subscribers';
import TestTrackingEvents from '../../tracking/test-tracker';
import { Global } from '@jest/types';
import { GherkinExample, GherkinScenario, GherkinScenarioOutline, GherkinStep } from '@autometa/shared-utilities';
describe('scenario outline', () => {
  describe('scenario', () => {
    describe('execute', () => {
      jest.mock('../scenario/scenario', () => {
        return jest.fn().mockImplementation(() => {
          return {
            execute: jest.fn((testFn: (...args: unknown[]) => void) =>
              testFn()
            ),
          };
        });
      });
      it('should run the scenarios associated with an outline', async () => {
        const subscribers = new TestTrackingSubscribers();
        const events = new TestTrackingEvents(subscribers);
        const outlineScenario = new GherkinScenario(
          'test',
          'desc',
          [new GherkinStep('Given', 'a test', [])],
          undefined,
          []
        );
        const parsedOutline = new GherkinScenarioOutline(
          'test',
          'desc',
          [
            {
              keyword: 'Given',
              text: 'a test',
            },
          ],
          [new GherkinExample(['a', 'b'], [['1', '2']])],
          [outlineScenario, outlineScenario],
          []
        );
        const sut = new ScenarioOutline('test', parsedOutline, [], [], events);
        const group = jest.fn((...args: (() => void)[]) =>
          args[1]()
        ) as unknown as jest.Describe;
        const testFn = jest.fn() as unknown as Global.It;
        const afterAll = jest.fn();
        const beforeAll = jest.fn();
        sut.execute(group, testFn, false, afterAll, beforeAll);
        expect(group).toHaveBeenCalled();
        expect(afterAll).toHaveBeenCalled();
        expect(testFn).toHaveBeenCalledTimes(2);
      });
    });
  });
});
