import { installCommonSteps } from "../../autometa/common.steps";
import { baseRunner, type BaseWorld } from "../../autometa/base-runner";
import { App } from "@autometa/runner";

import { BrewBuddyApp } from "./app";
import { BrewBuddyService } from "./services/brew-buddy-service";
import type { BrewBuddyWorld } from "./world";

export type { BaseWorld } from "../../autometa/base-runner";

type BrewBuddyRunnerWorld = BaseWorld &
  BrewBuddyWorld & { readonly app: BrewBuddyApp };

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

Given("the brew-buddy steps are loaded", function (this: BrewBuddyRunnerWorld) {
  this.brewBuddy.seen.push("loaded");
});

Given(
  "the brew-buddy app is available",
  function (this: BrewBuddyRunnerWorld) {
    ensure(this.app.id).toStrictEqual("brew-buddy-app");
    ensure(this.app.service.ping()).toStrictEqual("pong");
  }
);
