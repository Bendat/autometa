import { Scope, createToken } from "@autometa/injection";
import { HTTP } from "@autometa/http";
import { App, WORLD_TOKEN, type AppFactoryContext } from "@autometa/runner";

import { BrewBuddyMemoryService } from "../utils/memory";
import { BrewBuddyStreamManager } from "../services/stream-manager";
import type { BrewBuddyWorldBase } from "../world";
import { BrewBuddyApp } from "../utils/http";

const HTTP_CLIENT = createToken<HTTP>("brew-buddy.http-client");

export function registerBrewBuddyServices(
  compose: AppFactoryContext<BrewBuddyWorldBase>
): void {
  compose.registerClass(BrewBuddyMemoryService, {
    scope: Scope.SCENARIO,
    inject: {
      world: { token: WORLD_TOKEN, lazy: true },
    },
  });

  compose.registerClass(BrewBuddyStreamManager, {
    scope: Scope.SCENARIO,
    inject: {
      world: { token: WORLD_TOKEN, lazy: true },
    },
  });

  compose.registerFactory(
    HTTP_CLIENT,
    () => HTTP.create(),
    {
      scope: Scope.SCENARIO,
    }
  );
}

export const CompositionRoot = App.compositionRoot<BrewBuddyWorldBase, BrewBuddyApp>(
  BrewBuddyApp,
  {
    deps: [HTTP_CLIENT, BrewBuddyMemoryService],
    setup: registerBrewBuddyServices,
    inject: {
      streamManager: BrewBuddyStreamManager,
      world: { token: WORLD_TOKEN },
    },
  }
);
