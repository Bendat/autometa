import { Feature } from '@autometa/cucumber';
import { useConsoleGroups } from '@autometa/logging';

useConsoleGroups();

Feature(({ Scenario }) => {
  Scenario('Something Simple Can Happen', ({ Given, When, Then, And, But }) => {
    afterAll(() => {
      // assertions aren't validated until the end
      // of the test. It doesn't work in afterAll
      expect.assertions(5);
    });

    Given('a given step', () => {
      console.log('dog');
      expect(1).toBe(1);
    });

    When('a when step', () => {
      console.log('dog');
      expect(1).toBe(1);
    });

    Then('a then step', () => {
      console.log('dog');
      expect(1).toBe(1);
    });

    And('a and step', () => {
      expect(1).toBe(1);
    });

    But('a but step', () => {
      expect(1).toBe(1);
    });
  });
}, './basic-scenario.feature');
