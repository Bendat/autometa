import { And, Then, ensure, type BackofficeWorld } from "../../autometa.steps";

And("the orders module is discoverable", function (this: BackofficeWorld) {
  this.state["backoffice:orders:seen"] = true;
});

Then("the orders module steps should run", function (this: BackofficeWorld) {
  ensure(this.state["backoffice:orders:seen"]).toStrictEqual(true);
});
