import 'reflect-metadata';
import { Participant } from '..';
import { Browser, Role, Browses, Facilitator } from '../decorators';
import { Builder, WebDriver } from 'selenium-webdriver';
import { createFocusGroupAndFacilitator } from './construct-focus-group';
import { Class } from '@autometa/shared-utilities';
jest.mock('selenium-webdriver', () => {
  return {
    WebSite: jest.fn().mockImplementation(() => {
      return Object.create(WebDriver.prototype, {
        start: {
            value: jest.fn()
        }
      });
    }),
    WebDriver: jest.fn().mockImplementation(() => {
      return Object.create(WebDriver.prototype);
    }),
    Builder: jest.fn().mockImplementation(() => {
      return Object.create(Builder.prototype, {
        build: {
          writable: true,
        },
      });
    }),
  };
});
const mockedBuilder = jest.mocked(Builder, true);
const MockedBuilder = mockedBuilder as unknown as Class<Builder>;
const testBuilder = new MockedBuilder();
@Browser(testBuilder)
export class Users {
  @Role('Standard User')
  @Browses('https://www.saucedemo.com')
  @Facilitator
  Johnny: Participant;

  @Role('Admin User')
  @Browses('https://google.com')
  Jenny: Participant;
}

@Browser(testBuilder)
export class SingleUser {
  @Role('Standard User')
  @Browses('https://www.saucedemo.com')
  Johnny: Participant;
}
@Browser(testBuilder)
export class NoFacilitator {
  @Role('Standard User')
  @Browses('https://www.saucedemo.com')
  Johnny: Participant;

  @Role('Admin User')
  @Browses('https://google.com')
  Jenny: Participant;
}
describe('Constructing a focus group of participants', () => {
  it('should construct a focus group with a facilitator', () => {
    const { group, facilitator } = createFocusGroupAndFacilitator(Users);
    const johnnySite = Reflect.getMetadata('participant:site', group.Johnny);
    const jennySite = Reflect.getMetadata('participant:site', group.Jenny);
    expect(facilitator.name).toBe('Johnny');
    expect(johnnySite.url.href).toBe('https://www.saucedemo.com/');
    expect(jennySite.url.href).toBe('https://google.com/');
    expect(facilitator.then).toBeDefined();
  });

  it('should use the only participant as a facilitator if only one participant is defined', () => {
    const { facilitator } = createFocusGroupAndFacilitator(SingleUser);
    expect(facilitator.name).toBe('Johnny');
  });
  it('should throw an error if no participants are marked as facilitator', () => {
    const action = () => createFocusGroupAndFacilitator(NoFacilitator);
    expect(action).toThrow();
  });
});
