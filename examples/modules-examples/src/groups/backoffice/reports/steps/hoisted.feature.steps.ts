import { Given, Then, ensure, type BaseWorld } from "../../autometa.steps";

Given("the grouped steps are loaded", (world: BaseWorld) => {
  world.state["grouped:seen"] = true;
});

Then("the grouped step should run", (world: BaseWorld) => {
  ensure(world.state["grouped:seen"]).toStrictEqual(true);
});
