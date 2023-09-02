import { Given } from "autometa-runner";

Given("I have a background", ({ container }) => {
  container.steps = [1];
});

Given("I have a scenario with a background", ({ container }) => {
  container.steps.push(2);
  expect(container.steps).toEqual([1, 2]);
  console.log("success");
});
