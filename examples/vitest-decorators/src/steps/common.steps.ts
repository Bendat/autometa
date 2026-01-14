import {
  Binding,
  GivenDecorator as Given,
  Inject,
  WORLD_TOKEN,
  ensure,
} from "../step-definitions";
import { performRequest } from "../utils";
import type { BrewBuddyWorld } from "../world";

// Note: AfterScenario hook for stream cleanup is in step-definitions.ts

@Binding()
export class CommonSteps {
  constructor(@Inject(WORLD_TOKEN) private world: BrewBuddyWorld) {}

  @Given("the Brew Buddy API base URL is configured")
  async apiBaseUrlConfigured(): Promise<void> {
    // Store base URL for SSE connections
    this.world.scenario.apiBaseUrl = this.world.baseUrl;

    // Verify API is healthy
    await performRequest(this.world, "get", "/health");
    ensure.response.hasStatus(200);
  }

  @Given("the Brew Buddy menu is reset to the default offerings")
  async resetMenu(): Promise<void> {
    await performRequest(this.world, "post", "/admin/reset", {
      body: { scopes: ["menu", "recipes", "inventory", "loyalty", "orders"] },
    });
    ensure.response.hasStatus(204);
  }

  @Given("the recipe catalog is reset to the default recipes")
  async resetRecipeCatalog(): Promise<void> {
    await performRequest(this.world, "post", "/admin/reset", {
      body: { scopes: ["recipes"] },
    });
    ensure.response.hasStatus(204);
  }

  @Given("the order queue is cleared")
  async clearOrderQueue(): Promise<void> {
    await performRequest(this.world, "post", "/admin/reset", {
      body: { scopes: ["orders"] },
    });
    ensure.response.hasStatus(204);
  }
}
