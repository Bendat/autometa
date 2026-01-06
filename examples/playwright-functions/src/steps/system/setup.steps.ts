import { AfterScenario, ensure, Given } from "../../autometa/steps";

AfterScenario(({ world }) => {
  world.app.streamManager.dispose();
});

Given("the Brew Buddy API base URL is configured", async (world) => {
  // Store base URL for SSE connections
  world.scenario.apiBaseUrl = world.baseUrl;

  // Verify API is healthy
  await world.app.withHistory(world.app.admin.healthCheck());
  ensure.response.hasStatus(200);
});

Given("the Brew Buddy menu is reset to the default offerings", async (world) => {
  await world.app.withHistory(world.app.admin.reset({
    scopes: ["menu", "recipes", "inventory", "loyalty", "orders"],
  }));
  ensure.response.hasStatus(204);
});

Given("the recipe catalog is reset to the default recipes", async (world) => {
  await world.app.withHistory(world.app.admin.reset({ scopes: ["recipes"] }));
  ensure.response.hasStatus(204);
});

Given("the order queue is cleared", async (world) => {
  await world.app.withHistory(world.app.admin.reset({ scopes: ["orders"] }));
  ensure.response.hasStatus(204);
});
