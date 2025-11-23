import { Scope, createToken } from "@autometa/injection";
import { HTTP } from "@autometa/http";
import { App, WORLD_TOKEN, type AppFactoryContext } from "@autometa/runner";

import { BrewBuddyMemoryService } from "../utils/memory";
import { BrewBuddyStreamManager } from "../services/stream-manager";
import { TagRegistryService } from "../services/tag-registry.service";
import type { BrewBuddyWorldBase } from "../world";
import { BrewBuddyClient } from "../utils/http";

const HTTP_CLIENT = createToken<HTTP>("brew-buddy.http-client");

export function registerBrewBuddyServices(
  compose: AppFactoryContext<BrewBuddyWorldBase>
): void {
  compose
    .registerClass(BrewBuddyMemoryService, {
      scope: Scope.SCENARIO,
      inject: {
        world: { token: WORLD_TOKEN, lazy: true },
      },
    })
    .registerClass(BrewBuddyStreamManager, {
      scope: Scope.SCENARIO,
      inject: {
        world: { token: WORLD_TOKEN, lazy: true },
      },
    })
    .registerClass(TagRegistryService, {
      scope: Scope.SCENARIO,
    })
    .registerFactory(HTTP_CLIENT, () => HTTP.create(), {
      scope: Scope.SCENARIO,
    });
}

export const CompositionRoot = App.compositionRoot<
  BrewBuddyWorldBase,
  BrewBuddyClient
>(BrewBuddyClient, {
  deps: [HTTP_CLIENT, BrewBuddyMemoryService],
  setup: registerBrewBuddyServices,
  inject: {
    streamManager: BrewBuddyStreamManager,
    tags: TagRegistryService,
    world: { token: WORLD_TOKEN },
  },
});
