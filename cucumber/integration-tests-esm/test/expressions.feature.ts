import { Feature, Given, Then, When } from "@autometa/cucumber-runner";
import { expect } from "@jest/globals";
const names = ["Billy", "Eustace", "Beyonce"];
const genders = ["man", "boy", "girl"];
const numbers = [1, 2, 3];
const bools = [true, false, true];
Feature(() => {
  Given("a {word} named {word}", (gender: string, name: string) => {
    expect(gender).toBe(genders.shift());
    expect(name).toBe(names.shift());
  });
  When("a number {int}", (number: number) => {
    expect(number).toBe(numbers.shift());
  });
  Then("a bool {bool}", (bool: boolean) => {
    expect(bool).toBe(bools.shift());
  });
}, "./expressions.feature");