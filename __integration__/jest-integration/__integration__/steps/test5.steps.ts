import { Given, Teardown, When } from "@autometa/runner";
import { expect } from "@jest/globals";
const things = ["one", "three"];
const counts = [1, 3];
Given("an outline parameter {word} {word}", (thing) => {
  expect(thing).toBe(things.shift());
});

When("another outline parameter {int}", (count) => {
  expect(count).toBe(counts.shift());
});

Teardown("Count expects", () => {
  expect.assertions(4);
  console.log("success");
});
