import { Feature, Given, Pass, Rule } from "@autometa/cucumber-runner";
import { expect } from "@jest/globals";
const chickenCounts = [4, 5];
Feature(() => {
  Given("a test", Pass);

  Rule("This is my rule", () => {
    Given("a test", Pass);
    Given("{number} chickens", (number: number) => {
      expect(number).toEqual(chickenCounts.shift());
    });
  });
}, "./rule.feature");
