import { Feature, Pass, Then, When } from "@autometa/runner";

Feature(() => {
  When("I modify the app with {world:modify}", Pass);
  Then("the world contains {string}", (value, { world }) => {
    expect(world.expressionValue).toEqual(value);
  });
}, "../features/expression-app.feature");
