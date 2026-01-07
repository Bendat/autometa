import { Given, Then, ensure, type ModuleTestWorld } from "../../../../autometa/steps";

Given("the backoffice reports module is discoverable", (world: ModuleTestWorld) => {
  world.state["backoffice:reports:seen"] = true;
});

Then("the backoffice reports module steps should run", (world: ModuleTestWorld) => {
  ensure(world.state["backoffice:reports:seen"]).toStrictEqual(true);
});
