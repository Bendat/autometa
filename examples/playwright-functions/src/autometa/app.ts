import { Scope, createToken } from "@autometa/injection";
import { HTTP } from "@autometa/http";
import { App, WORLD_TOKEN, type AppFactoryContext } from "@autometa/runner";

import type { BrewBuddyWorldBase } from "../world";
import { BrewBuddyClient } from "../brew-buddy/api/client";
import { BrewBuddyMemoryService } from "../brew-buddy/state/memory.service";
import { BrewBuddyStreamManager } from "../brew-buddy/services/stream-manager";
import { TagRegistryService } from "../brew-buddy/services/tag-registry.service";
import { MenuService } from "../brew-buddy/capabilities/menu/menu.service";

const HTTP_CLIENT = createToken<HTTP>("brew-buddy.http-client");

/**
 * Register scenario-scoped services for the Brew Buddy test harness.
 *
 * Keeping this isolated makes the composition root easy to scan and copy/paste.
 */
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
    .registerClass(MenuService, {
      scope: Scope.SCENARIO,
      inject: {
        world: { token: WORLD_TOKEN, lazy: true },
      },
    })
    .registerFactory(HTTP_CLIENT, () => HTTP.create(), {
      scope: Scope.SCENARIO,
    });
}

/**
 * Brew Buddy app facade for steps.
 *
 * Convention:
 * - this belongs in `src/autometa/*` so test authors can ignore the wiring.
 * - the `world.app` surface becomes the ergonomic API for step definitions.
 */
export const brewBuddyApp = App.compositionRoot<BrewBuddyWorldBase, BrewBuddyClient>(
  BrewBuddyClient,
  {
    deps: [HTTP_CLIENT, BrewBuddyMemoryService],
    setup: registerBrewBuddyServices,
    inject: {
      streamManager: BrewBuddyStreamManager,
      tags: TagRegistryService,
      menu: MenuService,
      world: { token: WORLD_TOKEN },
    },
  }
);

export { HTTP_CLIENT };
