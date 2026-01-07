import { Given, ensure } from "../step-definitions";
import type { RunnerCompositionWorld } from "../world";

Given("the Brew Buddy API base URL is configured", async (world: RunnerCompositionWorld) => {
  // Store base URL for any downstream steps that need it.
  world.scenario.apiBaseUrl = world.baseUrl;

  // Verify API is healthy.
  await world.app.perform("get", "/health");
  const status = world.app.lastResponse?.status;
  ensure(status, { label: "health response status" }).toStrictEqual(200);
});
