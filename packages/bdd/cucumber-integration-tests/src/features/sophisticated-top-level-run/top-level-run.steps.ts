import { Feature } from '@autometa/cucumber';

Feature(({ All }) => {
  All(({ Given, When, Then }) => {
    Given('a 1', () => {
      console.log('given a 1');
    });
    Given('a 2', () => {
      console.log('given a 2');
    });
    When('a {word} arrives', (animal) => {
      console.log(animal);
    });
    When('a bat', () => {
      console.log('given a bat');
    });
    When('a cat', () => {
      console.log('when a cat');
    });
    When('a chicken', () => {
      console.log('when a chicken');
    });
    Then('a toyota', () => {
      console.log('then a toyota');
    });
    Then(/a (\w+) leaves/, (car) => {
      console.log(car);
    });
    Then('a {word}', (car) => {
      console.log('when a ' + car);
    });
  });
}, './top-level-run.feature');
