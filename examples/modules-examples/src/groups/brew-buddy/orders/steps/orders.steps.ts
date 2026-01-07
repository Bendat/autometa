import { Given, Then, ensure, type ModuleTestWorld } from "../../../../autometa/steps";

Given("the brew-buddy orders module is discoverable", (world: ModuleTestWorld) => {
  world.state["brew-buddy:orders:seen"] = true;
});

Then("the brew-buddy orders module steps should run", (world: ModuleTestWorld) => {
  ensure(world.state["brew-buddy:orders:seen"]).toStrictEqual(true);
});
