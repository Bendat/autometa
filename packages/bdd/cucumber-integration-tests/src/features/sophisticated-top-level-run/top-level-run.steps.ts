import { Feature } from "@autometa/cucumber";

Feature(({ All }) => {
  All(({ Given, When, Then }) => {
    Given('a 1', () => {});
    Given('a 2', () => {});
    When('a {word} arrives', (animal)=>{
        console.log(animal)
    })
    When('a bat', () => {});
    When('a cat', () => {});
    When('a chicken', () => {});
    Then('a toyota', () => {});
    Then(/a (\w+) leaves/, (car) => {
        console.log(car)
    });
    Then('a {word}', (car) => {});
  });
}, './top-level-run.feature');
