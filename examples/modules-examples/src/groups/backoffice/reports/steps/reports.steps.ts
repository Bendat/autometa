import { Given, Then, ensure } from "../../autometa.steps";

Given("the backoffice reports module is discoverable", (world) => {
  world.state["backoffice:reports:seen"] = true;
});

Then("the backoffice reports module steps should run", (world) => {
  ensure(world.state["backoffice:reports:seen"]).toStrictEqual(true);
});
