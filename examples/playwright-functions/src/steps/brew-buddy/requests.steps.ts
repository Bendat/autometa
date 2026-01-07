import { ensure, Then, When } from "../../autometa/steps";
import { HTTPError } from "@autometa/http";
import { toPathExpectations } from "../../brew-buddy/assertions/plugins";
import type { BrewBuddyWorld } from "../../world";
import type { HttpMethodInput } from "../../brew-buddy/api/client";
import type { MenuItem } from "../../../../.api/src/types/domain.js";

When(
  "I send a {httpMethod} request to {string}",
  async (method: HttpMethodInput, route: string, world: BrewBuddyWorld) => {
    const payload = parseOptionalDocstring(world.runtime.consumeDocstring());
    try {
      const segments = normalisePath(route);
      const responsePromise = world.app.http
        .route(...segments)
        .data(payload)
        .fetchWith(method);

      await world.app.history.track(responsePromise);
    } catch (error) {
      // Swallow HTTP errors - status will be checked in Then steps.
      if (error instanceof HTTPError) {
        return;
      }
      throw error;
    }
  }
);

Then("the response status should be {int}", (status: number, _world: BrewBuddyWorld) => {
  ensure.response.hasStatus(status);
});

Then(
  "the response status should not be {int}",
  (status: number, _world: BrewBuddyWorld) => {
    ensure.not.response.hasStatus(status);
  }
);

Then(
  "the response header {string} should start with {string}",
  (header: string, prefix: string, _world: BrewBuddyWorld) => {
    ensure.response.hasHeader(header, (value: string) => value.startsWith(prefix));
  }
);

Then(
  /^the response header \"([^\"]+)\" should not equal \"([^\"]+)\"$/,
  (...args: unknown[]) => {
    const _world = args.pop() as BrewBuddyWorld;
    const [header, unexpected] = args as [string, string];
    ensure.response.hasHeaderNot(header, (value: string) => value === unexpected);
  }
);

Then(
  /^the response header \"([^\"]+)\" should equal \"([^\"]+)\"$/,
  (...args: unknown[]) => {
    const _world = args.pop() as BrewBuddyWorld;
    const [header, expected] = args as [string, string];
    ensure.response.hasHeader(header, (value: string) => value === expected);
  }
);

Then("the response json should contain", (world: BrewBuddyWorld) => {
  const table = world.runtime.requireTable("horizontal");
  const expectations = toPathExpectations(table.records());
  ensure.json.contains(expectations);
});

Then(
  "the response json should contain an array at path {string}",
  (path: string, _world: BrewBuddyWorld) => {
    ensure.json.array(path);
  }
);

Then(
  "the response json should match the default menu snapshot",
  (world: BrewBuddyWorld) => {
    ensure.response.hasStatus(200);
    const body = world.app.history.lastResponseBody as
      | { items?: unknown[] }
      | unknown[];

    const items = Array.isArray(body) ? body : body?.items;

    if (!Array.isArray(items)) {
      throw new Error(
        "Expected response body to be an array or contain an items array"
      );
    }

    if (items.length === 0) {
      throw new Error("Expected menu to contain items");
    }

    const menuSnapshot = items.filter(isMenuItem) as MenuItem[];
    world.scenario.menuSnapshot = menuSnapshot;
  }
);

Then(/^each recipe should include fields (.+)$/, (...args: unknown[]) => {
  const world = args.pop() as BrewBuddyWorld;
  const [fieldsRaw] = args as [string];
  const matches = Array.from(fieldsRaw.matchAll(/\"([^\"]+)\"/g))
    .map(([, field]) => field)
    .filter(
      (field): field is string => typeof field === "string" && field.length > 0
    );

  if (matches.length === 0) {
    throw new Error(`Expected at least one quoted field name in: ${fieldsRaw}`);
  }

  const body = world.app.history.lastResponseBody as { recipes?: unknown } | undefined;
  if (!body || typeof body !== "object") {
    throw new Error("Expected response body to be an object containing recipes");
  }

  const recipes = (body as { recipes?: unknown }).recipes;
  if (!Array.isArray(recipes)) {
    throw new Error('Expected response body to include a "recipes" array');
  }

  for (const recipe of recipes) {
    if (!recipe || typeof recipe !== "object") {
      throw new Error("Each recipe should be represented as an object");
    }
    for (const field of matches) {
      if (!(field in (recipe as Record<string, unknown>))) {
        throw new Error(`Recipe is missing expected field: ${field}`);
      }
    }
  }
});

function isMenuItem(value: unknown): value is MenuItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<MenuItem>;
  return typeof candidate.name === "string" && typeof candidate.price === "number";
}

function parseOptionalDocstring(docstring: string | undefined): unknown {
  if (docstring === undefined) {
    return undefined;
  }
  const trimmed = docstring.trim();
  if (!trimmed) {
    return "";
  }
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function normalisePath(path: string): string[] {
  const trimmed = path.trim();
  if (!trimmed) {
    return [];
  }
  const url = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return url.split("/").filter(Boolean);
}
