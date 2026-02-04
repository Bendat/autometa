import { Given, type BaseWorld } from "../../autometa.steps";

Given("the api example module step is visible", function (this: BaseWorld) {
  this.state["api:example:seen"] = true;
});

