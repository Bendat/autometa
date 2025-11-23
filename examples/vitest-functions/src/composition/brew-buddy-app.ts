import { Scope } from "@autometa/injection";
import { App, WORLD_TOKEN, type AppFactoryContext } from "@autometa/runner";

import { BrewBuddyMemoryService } from "../utils/memory";
import type { BrewBuddyWorldBase } from "../world";
import { BrewBuddyApp } from "../utils/http";

export function registerBrewBuddyServices(
  compose: AppFactoryContext<BrewBuddyWorldBase>
): void {
  compose.registerClass(BrewBuddyMemoryService, {
    scope: Scope.SCENARIO,
    inject: {
      world: { token: WORLD_TOKEN, lazy: true },
    },
  });
}

export const CompositionRoot = App.compositionRoot<BrewBuddyWorldBase, BrewBuddyApp>(
  BrewBuddyApp,
  {
    deps: [BrewBuddyMemoryService],
    setup: registerBrewBuddyServices,
  }
);
