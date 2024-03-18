import { Given, Then, When } from "@autometa/runner";

Given("the given step is executed", (app) => {
  app.container.steps = [1];
});
When("the when step is executed", (app) => {
  app.container.steps.push(2);
});
Then("the then step is executed", (app) => {
  app.container.steps.push(3);
});
Then("the and step is executed", (app) => {
  app.container.steps.push(4);
});
Then("the but step is executed", (app) => {
  app.container.steps.push(5);
});
Then("the list step is executed", (app) => {
  expect(app.container.steps).toEqual([1, 2, 3, 4, 5]);
  console.log("success");
});
