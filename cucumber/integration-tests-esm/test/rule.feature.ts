import { Before, Feature, Given, Pass, Rule } from "@autometa/cucumber-runner";
import { expect } from "@jest/globals";
const chickenCounts = [4, 5];
Before("first before", Pass);
Feature(() => {
  Given("a test", Pass);

  Rule("This is my rule", () => {
    Before("second before", Pass);

    Given("a test", Pass);
    Given("{number} chickens", (number: number) => {
      expect(number).toEqual(chickenCounts.shift());
    });
  });
}, "./rule.feature");
