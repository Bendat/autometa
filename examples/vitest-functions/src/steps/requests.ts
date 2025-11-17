import type { StepRuntimeHelpers } from "@autometa/executor";

import { Then, When } from "../step-definitions";
import type { BrewBuddyWorld } from "../world";
import { performRequest, type HttpMethod } from "../utils/http";
import { assertHeaderEquals, assertHeaderStartsWith, assertJsonContains, assertJsonArray, assertStatus, toPathExpectations } from "../utils/assertions";
import { consumeHorizontalTable } from "../utils/tables";

When(
  "I send a {httpMethod} request to {string}",
  async (world: BrewBuddyWorld, method: HttpMethod, route: string, runtime: StepRuntimeHelpers) => {
    const payload = parseOptionalDocstring(runtime);
    await performRequest(world, method, route, payload === undefined ? {} : { body: payload });
  }
);

Then("the response status should be {int}", (world: BrewBuddyWorld, status: number) => {
  assertStatus(world, status);
});

Then("the response header {string} should start with {string}", (world: BrewBuddyWorld, header: string, prefix: string) => {
  assertHeaderStartsWith(world, header, prefix);
});

Then(/^the response header "([^"]+)" should equal "([^"]+)"$/, (world: BrewBuddyWorld, header: unknown, expected: unknown) => {
  assertHeaderEquals(world, String(header), String(expected));
});

Then("the response json should contain", (world: BrewBuddyWorld, runtime: StepRuntimeHelpers) => {
  const rows = consumeHorizontalTable(runtime);
  assertJsonContains(world, toPathExpectations(rows));
});

Then("the response json should contain an array at path {string}", (world: BrewBuddyWorld, path: string) => {
  assertJsonArray(world, path);
});

function parseOptionalDocstring(runtime: StepRuntimeHelpers): unknown {
  const docstring = runtime.consumeDocstring();
  if (docstring === undefined) {
    return undefined;
  }
  const trimmed = docstring.trim();
  if (!trimmed) {
    return "";
  }
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}
