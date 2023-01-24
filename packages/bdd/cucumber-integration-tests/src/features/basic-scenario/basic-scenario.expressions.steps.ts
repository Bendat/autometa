import { Feature } from '@autometa/cucumber';

Feature(({ Scenario }) => {
  Scenario('Something Simple Can Happen', ({ Given, When, Then, And, But }) => {
    Given('a {word} step', (keyword) => {
      expect(keyword).toBe('given');
    });

    When('a {word} step', (keyword) => {
      expect(keyword).toBe('when');
    });

    Then('a {word} step', (keyword) => {
      expect(keyword).toBe('then');
    });

    And('a {word} step', (keyword) => {
      expect(keyword).toBe('and');
    });

    But('a {word} step', (keyword) => {
      expect(keyword).toBe('but');
    });
  });
}, './basic-scenario.feature');
