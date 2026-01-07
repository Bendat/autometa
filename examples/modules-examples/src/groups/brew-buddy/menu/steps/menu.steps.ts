import { Given, Then, ensure, type BaseWorld } from "../../autometa.steps";

Given("the brew-buddy menu module is discoverable", (world: BaseWorld) => {
  world.state["brew-buddy:menu:seen"] = true;
});

Then("the brew-buddy menu module steps should run", (world: BaseWorld) => {
  ensure(world.state["brew-buddy:menu:seen"]).toStrictEqual(true);
});
