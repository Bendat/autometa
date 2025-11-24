import { Given, Then, When } from "../step-definitions";

Given("I have a step", (world) => {
  world.scenario.createdItems.push("example:given");
});

When("I do something", (world) => {
  world.scenario.createdItems.push("example:when");
});

Then("I expect a result", (world) => {
  if (!world.scenario.createdItems.includes("example:given")) {
    throw new Error("Expected the example Given step to run");
  }
  if (!world.scenario.createdItems.includes("example:when")) {
    throw new Error("Expected the example When step to run");
  }
});
