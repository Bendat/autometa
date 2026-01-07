import { Given, Then, ensure, type BaseWorld } from "../../../autometa.steps";

Given(
  "the backoffice orders cancellations submodule is discoverable",
  (world: BaseWorld) => {
    world.state["backoffice:orders:cancellations:seen"] = true;
  }
);

Then(
  "the backoffice orders cancellations submodule steps should run",
  (world: BaseWorld) => {
    ensure(world.state["backoffice:orders:cancellations:seen"]).toStrictEqual(true);
  }
);
