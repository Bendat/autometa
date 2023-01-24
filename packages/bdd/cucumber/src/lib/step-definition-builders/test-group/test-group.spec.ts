import { TestGroup } from './test-group';
import { PreparedStepCallback, Steps, StepData } from '../../types';

describe('TestGroup', () => {
  class Impl extends TestGroup {
    loadDefinedSteps(..._: Steps[]): void {
      throw new Error('Method not implemented.');
    }
    protected _findMatch = jest.fn(
      (regex: RegExp, _: string, callback: PreparedStepCallback) =>
        new StepData('a step', regex, callback, false)
    );
  }

  describe('steps', () => {
    it('should add a Given step', () => {
      const sut = new Impl('test');
      const { Given, steps } = sut;
      const fn = jest.fn();
      Given('test', fn);
      const { action, text } = steps.Given.test;
      expect(text).toEqual('test');
      expect(action).toEqual(fn);
    });

    it('should add a When step', () => {
      const sut = new Impl('test');
      const { When, steps } = sut;
      const fn = jest.fn();
      When('test', fn);
      const { action, text } = steps.When.test;
      expect(text).toEqual('test');
      expect(action).toEqual(fn);
    });
    it('should add a Then step', () => {
      const sut = new Impl('test');
      const { Then, steps } = sut;
      const fn = jest.fn();
      Then('test', fn);
      const { action, text } = steps.Then.test;
      expect(text).toEqual('test');
      expect(action).toEqual(fn);
    });
    it('should add a And step', () => {
      const sut = new Impl('test');
      const { And, steps } = sut;
      const fn = jest.fn();
      And('test', fn);
      const { action, text } = steps.And.test;
      expect(text).toEqual('test');
      expect(action).toEqual(fn);
    });
    it('should add a But step', () => {
      const sut = new Impl('test');
      const { But, steps } = sut;
      const fn = jest.fn();
      But('test', fn);
      const { action, text } = steps.But.test;
      expect(text).toEqual('test');
      expect(action).toEqual(fn);
    });
  });
});
