import { Given, Then, ensure, type ModuleTestWorld } from "../../../../../autometa/steps";

Given(
  "the backoffice orders cancellations submodule is discoverable",
  (world: ModuleTestWorld) => {
    world.state["backoffice:orders:cancellations:seen"] = true;
  }
);

Then(
  "the backoffice orders cancellations submodule steps should run",
  (world: ModuleTestWorld) => {
    ensure(world.state["backoffice:orders:cancellations:seen"]).toStrictEqual(true);
  }
);
