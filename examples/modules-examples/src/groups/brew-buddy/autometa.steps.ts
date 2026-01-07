import { installCommonSteps } from "../../autometa/common.steps";
import { baseRunner, type BaseWorld } from "../../autometa/base-runner";
import { App } from "@autometa/runner";

import { BrewBuddyApp } from "./app";
import { BrewBuddyService } from "./services/brew-buddy-service";
import type { BrewBuddyWorld } from "./world";

export type { BaseWorld } from "../../autometa/base-runner";

const runner = baseRunner
  .group("brew-buddy")
  .extendWorld<BrewBuddyWorld>({
  brewBuddy: { seen: [] },
  })
  .extendApp(
    App.compositionRoot<typeof BrewBuddyApp, BaseWorld & BrewBuddyWorld>(BrewBuddyApp, {
      deps: [BrewBuddyService],
      setup: (compose) => {
        compose.registerClass(BrewBuddyService);
      },
    })
  );

export const stepsEnvironment = runner.steps();
installCommonSteps(stepsEnvironment);

export const { Given, When, Then, And, But, ensure } = stepsEnvironment;

Given("the brew-buddy steps are loaded", (world) => {
  world.brewBuddy.seen.push("loaded");
});

Given("the brew-buddy app is available", (world) => {
  ensure(world.app.id).toStrictEqual("brew-buddy-app");
  ensure(world.app.service.ping()).toStrictEqual("pong");
});
