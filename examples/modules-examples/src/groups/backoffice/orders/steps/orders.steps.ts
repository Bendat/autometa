import { Given, Then, ensure, type BaseWorld } from "../../autometa.steps";

Given("the backoffice orders module is discoverable", (world: BaseWorld) => {
  world.state["backoffice:orders:seen"] = true;
});

Then("the backoffice orders module steps should run", (world: BaseWorld) => {
  ensure(world.state["backoffice:orders:seen"]).toStrictEqual(true);
});
