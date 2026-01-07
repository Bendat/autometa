import { Given, Then, ensure } from "../../../../autometa/steps";

Given("the backoffice orders module is discoverable", (world) => {
  world.state["backoffice:orders:seen"] = true;
});

Then("the backoffice orders module steps should run", (world) => {
  ensure(world.state["backoffice:orders:seen"]).toStrictEqual(true);
});
