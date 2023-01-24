import 'reflect-metadata';
import { FocusGroup, Participant, Participants } from '..';
import {
  Browser,
  Role,
  Browses,
  Facilitator,
} from '../decorators';
import { Builder, WebDriver } from 'selenium-webdriver';
import { Class } from '@autometa/shared-utilities';
import { Website, WebBrowser } from '@autometa/page-components';
const websiteFn = jest.fn();
jest.mock('@autometa/page-components', () => {
  return {
    Website: jest.fn().mockImplementation(() => {
      return Object.create(Website.prototype, {
        start: {
          value: websiteFn,
        },
      });
    }),
    WebBrowser: jest.fn().mockImplementation(() => {
      return Object.create(WebBrowser.prototype, {
        site: {
          value: function () {
            return new Website('https://localhost', this);
          },
        },
      });
    }),
  };
});
jest.mock('selenium-webdriver', () => {
  return {
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
const mockedWebDriver = jest.mocked(Builder, false);
const MockedWebDriver = mockedWebDriver as unknown as Class<WebDriver>;
@Browser(testBuilder)
export class Users implements Participants<Users> {
  @Role('Standard User')
  @Browses('https://www.saucedemo.com')
  @Facilitator
  Johnny: Participant;

  @Role('Admin User')
  @Browses('https://google.com')
  Jenny: Participant;
}

describe('Focus Groups', () => {
  it('should construct a Focus Group, start the webdriver and provide the Facilitator', async () => {
    const driver = new MockedWebDriver();
    testBuilder.build = jest.fn().mockReturnValue(driver);
    const facilitator = FocusGroup.begin(Users);
    await facilitator;
    expect(facilitator.name).toBe('Johnny');
    expect(websiteFn).toHaveBeenCalled();
  });
});
