import { Given, Then, ensure, type ModuleTestWorld } from "../../../../autometa/steps";

Given("the brew-buddy menu module is discoverable", (world: ModuleTestWorld) => {
  world.state["brew-buddy:menu:seen"] = true;
});

Then("the brew-buddy menu module steps should run", (world: ModuleTestWorld) => {
  ensure(world.state["brew-buddy:menu:seen"]).toStrictEqual(true);
});
