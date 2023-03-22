import { Feature, Given, Pass, Then, When } from "@autometa/cucumber-runner";
import { expect } from "@jest/globals";

Feature(() => {
  const ages = [23, 45, 32];
  const things = ["man", "tree", "Jira Ticket"];
  const colors = ["white", "red", "red", "green"];
  const animals = ["rabbit", "dog", "hellhound", "crocosaur"];
  Given("a {int} year old {words}", (age: number, thing: string) => {
    expect(age).toBe(ages.shift());
    expect(thing).toBe(things.shift());
  });
  Given("a {word} colored {word}", (color, animal) => {
    expect(color).toEqual(colors.shift());
    expect(animal).toEqual(animals.shift());
  });
}, "./scenario-outline.feature");
