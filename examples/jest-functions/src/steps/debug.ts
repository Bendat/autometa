import { Then } from "../step-definitions";
import type { BrewBuddyWorld } from "../world";

Then(
  "debug world state",
  (world: BrewBuddyWorld) => {
    console.log("=== World State Debug ===");
    console.log("Scenario:", JSON.stringify(world.scenario, null, 2));
    console.log("App:", JSON.stringify(world.app, null, 2));
    console.log("Lifecycle:", JSON.stringify(world.lifecycle, null, 2));
    console.log("========================");
  }
);

Then(
  "log response body",
  (world: BrewBuddyWorld) => {
    console.log("Response Body:", JSON.stringify(world.app.lastResponseBody, null, 2));
  }
);
