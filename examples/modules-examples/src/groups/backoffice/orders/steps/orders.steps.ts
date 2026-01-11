import { Given, Then, ensure, type BaseWorld } from "../../autometa.steps";

Given("the backoffice orders module is discoverable", function (this: BaseWorld) {
  this.state["backoffice:orders:seen"] = true;
});

Then("the backoffice orders module steps should run", function (this: BaseWorld) {
  ensure(this.state["backoffice:orders:seen"]).toStrictEqual(true);
});
