import { createToken } from "@autometa/core/injection";
import { HTTP } from "@autometa/core/http";
import { App, WORLD_TOKEN, type AppFactoryContext } from "@autometa/core/runner";

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
    .registerClass(HttpHistoryService)
    .registerClass(BrewBuddyMemoryService, {
      inject: {
        world: { token: WORLD_TOKEN, lazy: true },
      },
    })
    .registerClass(BrewBuddyStreamManager, {
      inject: {
        world: { token: WORLD_TOKEN, lazy: true },
      },
    })
    .registerClass(TagRegistryService)
    .registerClass(MenuService, {
      inject: {
        world: { token: WORLD_TOKEN, lazy: true },
      },
    })
    .registerClass(OrdersService, {
      deps: [HttpHistoryService, BrewBuddyMemoryService, OrderClient],
      inject: {
        world: { token: WORLD_TOKEN, lazy: true },
      },
    })
    .registerClass(MenuClient, {
      deps: [HTTP_CLIENT],
    })
    .registerClass(RecipeClient, {
      deps: [HTTP_CLIENT],
    })
    .registerClass(OrderClient, {
      deps: [HTTP_CLIENT],
    })
    .registerClass(LoyaltyClient, {
      deps: [HTTP_CLIENT],
    })
    .registerClass(InventoryClient, {
      deps: [HTTP_CLIENT],
    })
    .registerClass(AdminClient, {
      deps: [HTTP_CLIENT],
    })
    .registerClass(RecipeCatalogService)
    .registerClass(RecipeArrangerService, {
      deps: [HttpHistoryService, RecipeClient, BrewBuddyMemoryService, RecipeCatalogService],
    })
    .registerFactory(HTTP_CLIENT, () => HTTP.create())
    .registerClass(BrewBuddyClient, {
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
      inject: {
        streamManager: BrewBuddyStreamManager,
        tags: TagRegistryService,
        menu: MenuService,
        ordering: OrdersService,
        world: { token: WORLD_TOKEN },
      },
    });
}

/**
 * Brew Buddy app facade for steps.
 *
 * Convention:
 * - this belongs in `src/autometa/*` so test authors can ignore the wiring.
 * - the `world.app` surface becomes the ergonomic API for step definitions.
 */
export const brewBuddyApp = App.compositionRoot(
  BrewBuddyClient,
  {
    setup: registerBrewBuddyServices,
  }
);



export { HTTP_CLIENT };