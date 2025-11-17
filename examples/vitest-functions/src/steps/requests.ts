import type { RunnerStepsSurface } from "@autometa/runner";
import type { StepRuntimeHelpers } from "@autometa/executor";

import type { BrewBuddyWorld } from "../world";
import { performRequest } from "../utils/http";
import { assertHeaderEquals, assertHeaderStartsWith, assertJsonContains, assertJsonArray, assertStatus, toPathExpectations } from "../utils/assertions";
import { consumeHorizontalTable } from "../utils/tables";

export function registerHttpSteps(environment: RunnerStepsSurface<BrewBuddyWorld>): void {
  environment.When(
    /^I send a (GET|POST|PATCH|DELETE) request to "([^"]+)"$/,
    async (world: BrewBuddyWorld, method: unknown, route: unknown, runtime: unknown) => {
      const verb = String(method);
      const path = String(route);
      const payload = parseOptionalDocstring(runtime as StepRuntimeHelpers);
      await performRequest(world, verb, path, payload === undefined ? {} : { body: payload });
    }
  );

  environment.Then(/^the response status should be (\d+)$/, (world: BrewBuddyWorld, status: unknown) => {
    assertStatus(world, Number(status));
  });

  environment.Then(
    /^the response header "([^"]+)" should start with "([^"]+)"$/,
    (world: BrewBuddyWorld, header: unknown, prefix: unknown) => {
      assertHeaderStartsWith(world, String(header), String(prefix));
    }
  );

  environment.Then(
    /^the response header "([^"]+)" should equal "([^"]+)"$/,
    (world: BrewBuddyWorld, header: unknown, expected: unknown) => {
      assertHeaderEquals(world, String(header), String(expected));
    }
  );

  environment.Then("the response json should contain", (world: BrewBuddyWorld, runtime: unknown) => {
    const rows = consumeHorizontalTable(runtime as StepRuntimeHelpers);
    assertJsonContains(world, toPathExpectations(rows));
  });

  environment.Then(
    /^the response json should contain an array at path "([^"]+)"$/,
    (world: BrewBuddyWorld, path: unknown) => {
      assertJsonArray(world, String(path));
    }
  );
}

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
