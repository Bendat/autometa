import { ensure, Then, When } from "../step-definitions";
import { performRequest } from "../utils/http";
import { toPathExpectations } from "../utils/assertions";
import type { BrewBuddyWorld } from "../world";
import type { HttpMethodInput } from "../utils/http";
import type { MenuItem } from "../../../.api/src/types/domain.js";
import type { StepRuntimeHelpers } from "@autometa/executor";

When(
  "I send a {httpMethod} request to {string}",
  async (method: HttpMethodInput, route: string, world: BrewBuddyWorld) => {
    const payload = parseOptionalDocstring(world.runtime.consumeDocstring());
    const requestOptions = payload === undefined ? {} : { body: payload };
    await performRequest(world, method, route, requestOptions);
  }
);

Then(
  "the response status should be {int}",
  function (this: BrewBuddyWorld, ...args: unknown[]) {
    const { world, expression } = splitArguments(this, args);
    const [status] = expression;
    if (typeof status !== "number") {
      throw new Error("Response status expectation requires a numeric argument.");
    }
    ensure(world).response.hasStatus(status);
  }
);

Then(
  "the response header {string} should start with {string}",
  function (this: BrewBuddyWorld, ...args: unknown[]) {
    const { world, expression } = splitArguments(this, args);
    const [header, prefix] = expression;
    if (typeof header !== "string" || typeof prefix !== "string") {
      throw new Error("Header expectation requires string arguments.");
    }
    ensure(world).response.hasHeader(header, (value) => value.startsWith(prefix));
  }
);

Then(
  /^the response header "([^"]+)" should equal "([^"]+)"$/,
  function (this: BrewBuddyWorld, ...args: unknown[]) {
    const { world, expression } = splitArguments(this, args);
    const [header, expected] = expression;
    if (typeof header !== "string" || typeof expected !== "string") {
      throw new Error("Header expectation requires string arguments.");
    }
    ensure(world).response.hasHeader(header, (value) => value === expected);
  }
);

Then(
  "the response json should contain",
  function (this: BrewBuddyWorld, ...args: unknown[]) {
    const { world } = splitArguments(this, args);
    const table = world.runtime.requireTable("horizontal");
    const expectations = toPathExpectations(table.records());
    ensure(world).json.contains(expectations);
  }
);

Then(
  "the response json should contain an array at path {string}",
  function (this: BrewBuddyWorld, ...args: unknown[]) {
    const { world, expression } = splitArguments(this, args);
    const [path] = expression;
    if (typeof path !== "string") {
      throw new Error("Array expectation requires a string path argument.");
    }
    ensure(world).json.array(path);
  }
);

Then(
  "the response json should match the default menu snapshot",
  function (this: BrewBuddyWorld, ...args: unknown[]) {
    const { world } = splitArguments(this, args);
    ensure(world).response.hasStatus(200);
    const body = world.lastResponseBody;

    if (!Array.isArray(body)) {
      throw new Error("Expected response body to be an array");
    }

    if (body.length === 0) {
      throw new Error("Expected menu to contain items");
    }

    const menuSnapshot = body.filter(isMenuItem) as MenuItem[];
    world.scenario.menuSnapshot = menuSnapshot;
  }
);

Then(
  /^each recipe should include fields (.+)$/,
  function (this: BrewBuddyWorld, ...args: unknown[]) {
    const { world, expression } = splitArguments(this, args);
    const [fieldsRaw] = expression;
    if (typeof fieldsRaw !== "string") {
      throw new Error("Recipe field expectation requires a string argument.");
    }
    const matches = Array.from(fieldsRaw.matchAll(/"([^"]+)"/g))
      .map(([, field]) => field)
      .filter((field): field is string => typeof field === "string" && field.length > 0);

    if (matches.length === 0) {
      throw new Error(`Expected at least one quoted field name in: ${fieldsRaw}`);
    }

    const body = world.lastResponseBody as { recipes?: unknown } | undefined;
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
  }
);

function splitArguments(
  thisWorld: BrewBuddyWorld,
  args: readonly unknown[]
): { world: BrewBuddyWorld; expression: readonly unknown[] } {
  if (args.length === 0) {
    return { world: thisWorld, expression: [] };
  }

  const values = Array.from(args);
  const last = values[values.length - 1];
  const world = isWorld(last) ? (last as BrewBuddyWorld) : thisWorld;
  const trimmed = isWorld(last) ? values.slice(0, -1) : values;

  if (trimmed.length === 0) {
    return { world, expression: [] };
  }

  const maybeRuntime = trimmed[trimmed.length - 1];
  const expression = isRuntimeHelpers(maybeRuntime)
    ? trimmed.slice(0, -1)
    : trimmed;

  return { world, expression };
}

function isWorld(value: unknown): value is BrewBuddyWorld {
  return Boolean(value && typeof value === "object" && "runtime" in (value as object));
}

function isRuntimeHelpers(value: unknown): value is StepRuntimeHelpers {
  return (
    Boolean(value && typeof value === "object") &&
    "consumeDocstring" in (value as { consumeDocstring?: unknown })
  );
}

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
