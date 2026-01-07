import { Given, Then, ensure } from "../../../../autometa/steps";

Given("the brew-buddy orders module is discoverable", (world) => {
  world.state["brew-buddy:orders:seen"] = true;
});

Then("the brew-buddy orders module steps should run", (world) => {
  ensure(world.state["brew-buddy:orders:seen"]).toStrictEqual(true);
});
