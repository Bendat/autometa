import { Feature } from '@autometa/cucumber';

Feature(({ All }) => {
  All(({ Given, When, Then }) => {
    Given('a 1', () => {
      console.log("given a 1")

    });
    Given('a 2', () => {
      console.log("given a 2")

    });
    When('a bat', () => {
      console.log("when a bat")

    });
    When('a cat', () => {
      console.log("when a cat")

    });
    Then('a toyota', () => {
      console.log("then a toyota")

    });
    Then('a mazda', () => {
      console.log("then a mazda")

    });
  });
}, './top-level-run.feature');
