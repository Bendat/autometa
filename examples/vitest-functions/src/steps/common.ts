import { AfterScenario, Given } from "../step-definitions";

import { disposeStream } from "../world";
import { performRequest } from "../utils/http";
import { assertStatus } from "../utils/assertions";

AfterScenario(({ world }) => {
  disposeStream(world);
});

Given(
  "the Brew Buddy API base URL is configured",
  async (world) => {
    await performRequest(world, "get", "/health");
    assertStatus(world, 200);
  }
);

Given(
  "the Brew Buddy menu is reset to the default offerings",
  async (world) => {
    await performRequest(world, "post", "/admin/reset", {
      body: { scopes: ["menu", "recipes", "inventory", "loyalty", "orders"] },
    });
    assertStatus(world, 204);
  }
);

Given("the order queue is cleared", async (world) => {
  await performRequest(world, "post", "/admin/reset", {
    body: { scopes: ["orders"] },
  });
  assertStatus(world, 204);
});


