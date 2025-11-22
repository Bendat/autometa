import { Scope } from "@autometa/injection";
import { WORLD_TOKEN, type AppFactoryContext } from "@autometa/runner";

import { BrewBuddyMemoryService } from "../utils/memory";
import type { BrewBuddyWorldBase } from "../world";

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
