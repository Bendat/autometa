import { Given, Then, ensure, type ModuleTestWorld } from "../../../../autometa/steps";

Given("the backoffice orders module is discoverable", (world: ModuleTestWorld) => {
  world.state["backoffice:orders:seen"] = true;
});

Then("the backoffice orders module steps should run", (world: ModuleTestWorld) => {
  ensure(world.state["backoffice:orders:seen"]).toStrictEqual(true);
});
