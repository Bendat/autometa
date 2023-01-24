import Background from './background';
import { ExtendedStepCallbackProvider, StepCallbackProvider, StepFunctions } from '../../types';
import { Store, World } from '@autometa/store';

const store = { Store: new Store(), World: new World() };
describe('background', () => {
  describe('steps', () => {
    const mockScenarioCallbackObject: StepFunctions = {
      Given: jest.fn() as unknown as ExtendedStepCallbackProvider,
      When: jest.fn() as unknown as ExtendedStepCallbackProvider,
      Then: jest.fn() as unknown as ExtendedStepCallbackProvider,
      And: jest.fn() as unknown as ExtendedStepCallbackProvider,
      But: jest.fn() as unknown as ExtendedStepCallbackProvider,
      Shared: jest.fn(),
    };
    it('should add a Given step', () => {
      const callback = ({ Given }: { Given: StepCallbackProvider }) =>
        Given('test', jest.fn());
      const sut = new Background('', callback);
      sut.stepCallbacks(mockScenarioCallbackObject, store);
      expect(mockScenarioCallbackObject.Given).toHaveBeenCalledTimes(1);
    });
    it('should add a When step', () => {
      const callback = ({ When }: { When: StepCallbackProvider }) =>
        When('test', jest.fn());
      const sut = new Background('', callback);
      sut.stepCallbacks(mockScenarioCallbackObject, store);
      expect(mockScenarioCallbackObject.When).toHaveBeenCalledTimes(1);
    });
    it('should add a Then step', () => {
      const callback = ({ Then }: { Then: StepCallbackProvider }) =>
        Then('test', jest.fn());
      const sut = new Background('', callback);
      sut.stepCallbacks(mockScenarioCallbackObject, store);
      expect(mockScenarioCallbackObject.Then).toHaveBeenCalledTimes(1);
    });
    it('should add a And step', () => {
      const callback = ({ And }: { And: StepCallbackProvider }) =>
        And('test', jest.fn());
      const sut = new Background('', callback);
      sut.stepCallbacks(mockScenarioCallbackObject, store);
      expect(mockScenarioCallbackObject.And).toHaveBeenCalledTimes(1);
    });
    it('should add a But step', () => {
      const callback = ({ But }: { But: StepCallbackProvider }) =>
        But('test', jest.fn());
      const sut = new Background('', callback);
      sut.stepCallbacks(mockScenarioCallbackObject, store);
      expect(mockScenarioCallbackObject.But).toHaveBeenCalledTimes(1);
    });
  });
});
