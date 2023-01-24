import 'reflect-metadata';
import { PageObject, Website } from '@autometa/page-components';
import { Action } from '../..';
import { ActionPerformance } from '.';
import { Class } from '@autometa/shared-utilities';
jest.mock('@autometa/page-components', () => {
  return {
    Website: jest.fn().mockImplementation(() => {
      return Object.create(Website.prototype);
    }),
  };
});
jest.mock('../..', () => {
  return {
    Action: jest.fn().mockImplementation(() => {
      return Object.create(Website.prototype, {
        execute: {
          value: jest.fn(),
        },
      });
    }),
  };
});
const mockedWebsite = jest.mocked(Website);
const MockedWebsite = mockedWebsite as unknown as Class<Website>;
const mockedAction = jest.mocked(Action);
const MockedAction = mockedAction as unknown as Class<
  Action<PageObject, PageObject>
>;
describe('Actionable Performance', () => {
  it('should execute an action', async () => {
    const action = new MockedAction();
    const site = new MockedWebsite();
    const performance = new ActionPerformance(action);
    await performance.performance(site);
    expect(action.execute).toBeCalledWith(site);
  });
});
