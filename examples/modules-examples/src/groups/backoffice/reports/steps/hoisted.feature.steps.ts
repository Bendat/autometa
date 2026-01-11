import { Given, Then, ensure, type BaseWorld } from "../../autometa.steps";

Given("the grouped steps are loaded", function (this: BaseWorld) {
  this.state["grouped:seen"] = true;
});

Then("the grouped step should run", function (this: BaseWorld) {
  ensure(this.state["grouped:seen"]).toStrictEqual(true);
});
