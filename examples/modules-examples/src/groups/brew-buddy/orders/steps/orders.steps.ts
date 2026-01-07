import { Given, Then, ensure, type BaseWorld } from "../../autometa.steps";

Given("the brew-buddy orders module is discoverable", (world: BaseWorld) => {
  world.state["brew-buddy:orders:seen"] = true;
});

Then("the brew-buddy orders module steps should run", (world: BaseWorld) => {
  ensure(world.state["brew-buddy:orders:seen"]).toStrictEqual(true);
});
