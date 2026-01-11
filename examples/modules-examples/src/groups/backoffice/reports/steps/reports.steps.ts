import { Given, Then, ensure, type BaseWorld } from "../../autometa.steps";

Given("the backoffice reports module is discoverable", function (this: BaseWorld) {
  this.state["backoffice:reports:seen"] = true;
});

Then("the backoffice reports module steps should run", function (this: BaseWorld) {
  ensure(this.state["backoffice:reports:seen"]).toStrictEqual(true);
});
