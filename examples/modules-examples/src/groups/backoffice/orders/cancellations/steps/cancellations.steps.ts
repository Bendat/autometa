import { Given, Then, ensure, type BaseWorld } from "../../../autometa.steps";

Given(
  "the backoffice orders cancellations submodule is discoverable",
  function (this: BaseWorld) {
    this.state["backoffice:orders:cancellations:seen"] = true;
  }
);

Then(
  "the backoffice orders cancellations submodule steps should run",
  function (this: BaseWorld) {
    ensure(this.state["backoffice:orders:cancellations:seen"]).toStrictEqual(true);
  }
);
