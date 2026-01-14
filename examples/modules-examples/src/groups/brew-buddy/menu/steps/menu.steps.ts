import { Given, Then, ensure, type BaseWorld } from "../../autometa.steps";

Given("the brew-buddy menu module is discoverable", function (this: BaseWorld) {
  this.state["brew-buddy:menu:seen"] = true;
});

Then("the brew-buddy menu module steps should run", function (this: BaseWorld) {
  ensure(this.state["brew-buddy:menu:seen"]).toStrictEqual(true);
});
