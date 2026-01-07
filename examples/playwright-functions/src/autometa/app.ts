import { Scope, createToken } from "@autometa/injection";
import { HTTP } from "@autometa/http";
import { App, WORLD_TOKEN, type AppFactoryContext } from "@autometa/runner";

import type { BrewBuddyWorldBase } from "../world";
import { BrewBuddyClient } from "../brew-buddy/domain/clients/client";
import { BrewBuddyMemoryService } from "../brew-buddy/state/memory.service";
import { BrewBuddyStreamManager } from "../brew-buddy/services/stream-manager";
import { TagRegistryService } from "../brew-buddy/services/tag-registry.service";
import { MenuService } from "../brew-buddy/capabilities/menu/menu.service";
import { MenuClient } from "../brew-buddy/domain/clients/menu-client";
import { RecipeClient } from "../brew-buddy/domain/clients/recipe-client";
import { OrderClient } from "../brew-buddy/domain/clients/order-client";
import { LoyaltyClient } from "../brew-buddy/domain/clients/loyalty-client";
import { InventoryClient } from "../brew-buddy/domain/clients/inventory-client";
import { AdminClient } from "../brew-buddy/domain/clients/admin-client";
import { HttpHistoryService } from "../brew-buddy/http/http-history.service";
import { RecipeCatalogService } from "../brew-buddy/recipes/recipe-catalog.service";
import { RecipeArrangerService } from "../brew-buddy/recipes/recipe-arranger.service";
import { OrdersService } from "../brew-buddy/capabilities/orders/orders.service";

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
    .registerClass(HttpHistoryService, {
      scope: Scope.SCENARIO,
    })
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
    .registerClass(OrdersService, {
      scope: Scope.SCENARIO,
      deps: [HttpHistoryService, BrewBuddyMemoryService, OrderClient],
      inject: {
        world: { token: WORLD_TOKEN, lazy: true },
      },
    })
    .registerClass(MenuClient, {
      scope: Scope.SCENARIO,
      deps: [HTTP_CLIENT],
    })
    .registerClass(RecipeClient, {
      scope: Scope.SCENARIO,
      deps: [HTTP_CLIENT],
    })
    .registerClass(OrderClient, {
      scope: Scope.SCENARIO,
      deps: [HTTP_CLIENT],
    })
    .registerClass(LoyaltyClient, {
      scope: Scope.SCENARIO,
      deps: [HTTP_CLIENT],
    })
    .registerClass(InventoryClient, {
      scope: Scope.SCENARIO,
      deps: [HTTP_CLIENT],
    })
    .registerClass(AdminClient, {
      scope: Scope.SCENARIO,
      deps: [HTTP_CLIENT],
    })
    .registerClass(RecipeCatalogService, {
      scope: Scope.SCENARIO,
    })
    .registerClass(RecipeArrangerService, {
      scope: Scope.SCENARIO,
      deps: [HttpHistoryService, RecipeClient, BrewBuddyMemoryService, RecipeCatalogService],
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
    deps: [
      HTTP_CLIENT,
      BrewBuddyMemoryService,
      HttpHistoryService,
      MenuClient,
      RecipeClient,
      OrderClient,
      LoyaltyClient,
      InventoryClient,
      AdminClient,
      RecipeArrangerService,
    ],
    setup: registerBrewBuddyServices,
    inject: {
      streamManager: BrewBuddyStreamManager,
      tags: TagRegistryService,
      menu: MenuService,
      ordering: OrdersService,
      world: { token: WORLD_TOKEN },
    },
  }
);

export { HTTP_CLIENT };