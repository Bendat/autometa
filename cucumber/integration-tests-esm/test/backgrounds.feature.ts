import { Feature, Given, Pass } from "@autometa/cucumber-runner";
import { expect } from "@jest/globals";
let counter1 = 0;
let counter2 = 0;
Given("a background step", () => {
  counter1++;
});
Given("a scenario step", () => {
  expect(counter1).toBe(1);
});
Given("a rule background step", () => {
  counter2++;
});
Given("a rule scenario step", () => {
  expect(counter2).toBe(1);
});
Feature("./backgrounds.feature");
