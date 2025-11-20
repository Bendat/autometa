import { AfterScenario, ensure, Given } from "../step-definitions";
import { disposeStream } from "../world";
import { performRequest } from "../utils/http";

AfterScenario(({ world }) => {
  disposeStream(world);
});

Given(
  "the Brew Buddy API base URL is configured",
  async (world) => {
    // Store base URL for SSE connections
    world.scenario.apiBaseUrl = world.baseUrl;
    
    // Verify API is healthy
    await performRequest(world, "get", "/health");
    ensure(world).response.hasStatus(200);
  }
);

Given(
  "the Brew Buddy menu is reset to the default offerings",
  async (world) => {
    await performRequest(world, "post", "/admin/reset", {
      body: { scopes: ["menu", "recipes", "inventory", "loyalty", "orders"] },
    });
    ensure(world).response.hasStatus(204);
  }
);

Given(
  "the recipe catalog is reset to the default recipes",
  async (world) => {
    await performRequest(world, "post", "/admin/reset", {
      body: { scopes: ["recipes"] },
    });
    ensure(world).response.hasStatus(204);
  }
);

Given("the order queue is cleared", async (world) => {
  await performRequest(world, "post", "/admin/reset", {
    body: { scopes: ["orders"] },
  });
  ensure(world).response.hasStatus(204);
});


