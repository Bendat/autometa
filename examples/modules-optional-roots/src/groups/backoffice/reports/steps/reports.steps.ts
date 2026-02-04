import { And, Then, ensure, type BackofficeWorld } from "../../autometa.steps";

And("the reports module is discoverable", function (this: BackofficeWorld) {
  this.state["backoffice:reports:seen"] = true;
});

Then("the reports module steps should run", function (this: BackofficeWorld) {
  ensure(this.state["backoffice:reports:seen"]).toStrictEqual(true);
});
