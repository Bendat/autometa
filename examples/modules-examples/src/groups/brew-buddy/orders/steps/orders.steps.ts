import { Given, Then, ensure, type BaseWorld } from "../../autometa.steps";

Given("the brew-buddy orders module is discoverable", function (this: BaseWorld) {
  this.state["brew-buddy:orders:seen"] = true;
});

Then("the brew-buddy orders module steps should run", function (this: BaseWorld) {
  ensure(this.state["brew-buddy:orders:seen"]).toStrictEqual(true);
});
