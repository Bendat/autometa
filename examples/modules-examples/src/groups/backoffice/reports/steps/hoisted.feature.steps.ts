import { Given, Then, ensure, type ModuleTestWorld } from "../../../../autometa/steps";

Given("the grouped steps are loaded", (world: ModuleTestWorld) => {
  world.state["grouped:seen"] = true;
});

Then("the grouped step should run", (world: ModuleTestWorld) => {
  ensure(world.state["grouped:seen"]).toStrictEqual(true);
});
