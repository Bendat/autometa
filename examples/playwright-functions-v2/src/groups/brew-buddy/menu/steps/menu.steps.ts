import { Given, Then, ensure } from "../../../../autometa/steps";

Given("the brew-buddy menu module is discoverable", (world) => {
  world.state["brew-buddy:menu:seen"] = true;
});

Then("the brew-buddy menu module steps should run", (world) => {
  ensure(world.state["brew-buddy:menu:seen"]).toStrictEqual(true);
});
