import { Feature } from '@autometa/cucumber';

Feature(({ Scenario }) => {
  Scenario('Something Simple Can Happen', ({ Given, When, Then, And, But }) => {
    Given(/a (\w+) step/, (keyword) => {
      expect(keyword).toBe('given');
    });

    When(/a (\w+) step/, (keyword) => {
      expect(keyword).toBe('when');
    });

    Then(/a (\w+) step/, (keyword) => {
      expect(keyword).toBe('then');
    });

    And(/a (\w+) step/, (keyword) => {
      expect(keyword).toBe('and');
    });

    But(/a (\w+) step/, (keyword) => {
      expect(keyword).toBe('but');
    });
  });
}, './basic-scenario.feature');
