import { Feature, Given, HTable, Pass, When } from "@autometa/cucumber-runner";
import { expect } from "@jest/globals";
Given("a dog", Pass);
When("a rabbit, {word}, kills", (name: string) => {
  expect(name).toBe("frank");
});
