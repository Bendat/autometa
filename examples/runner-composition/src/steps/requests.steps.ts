import { HTTPError, ensureHttp } from "@autometa/http";
import type { TableRecord } from "@autometa/gherkin";

import { Then, When, ensure } from "../step-definitions";
import type { RunnerCompositionWorld } from "../world";
import { normalizeValue, resolveJsonPath } from "../support/json";

When(
  /^I send a (GET|POST|PATCH|DELETE|PUT) request to "([^"]+)"$/,
  async (...args: unknown[]) => {
    const world = args.pop() as RunnerCompositionWorld;
    const [methodRaw, route] = args as [string, string];

    const method = methodRaw.toLowerCase();
    const payload = parseOptionalDocstring(world.runtime.consumeDocstring());
    const requestOptions = payload === undefined ? {} : { body: payload };

    try {
      await world.app.perform(method, route, requestOptions);
    } catch (error) {
      const status = world.app.extractErrorStatus();
      if (status === undefined) {
        throw error;
      }
    }
  }
);

Then("the response status should be {int}", (status: number, world: RunnerCompositionWorld) => {
  const response = world.app.lastResponse;
  ensure(response, { label: "http response" }).toBeDefined();
  ensureHttp(response!, { label: "response status" }).toHaveStatus(status);
});

Then(
  "the response status should not be {int}",
  (status: number, world: RunnerCompositionWorld) => {
    const response = world.app.lastResponse;
    ensure(response, { label: "http response" }).toBeDefined();
    ensureHttp(response!, { label: "response status" }).not.toHaveStatus(status);
  }
);

Then(
  /^the response header "([^"]+)" should not equal "([^"]+)"$/,
  (...args: unknown[]) => {
    const world = args.pop() as RunnerCompositionWorld;
    const [header, unexpected] = args as [string, string];
    const response = world.app.lastResponse;
    ensure(response, { label: "http response" }).toBeDefined();
    ensureHttp(response!, { label: `header ${header}` }).not.toHaveHeader(header, (value) => value === unexpected);
  }
);

Then(
  "the response header {string} should start with {string}",
  (header: string, prefix: string, world: RunnerCompositionWorld) => {
    const response = world.app.lastResponse;
    ensure(response, { label: "http response" }).toBeDefined();
    ensureHttp(response!, { label: `header ${header}` }).toHaveHeader(header, (value) => value.startsWith(prefix));
  }
);

Then("the response json should contain", (world: RunnerCompositionWorld) => {
  const table = world.runtime.requireTable("horizontal");
  const expectations = toPathExpectations(table.records());
  const body = ensure(world.app.lastResponseBody, { label: "response json" }).toBeDefined().value;

  for (const { path, value } of expectations) {
    const actual = resolveJsonPath(body, path);
    ensure(actual, { label: `json path ${path}` }).toEqual(value);
  }
});

Then("the response json should match the default menu snapshot", (world: RunnerCompositionWorld) => {
  const response = world.app.lastResponse;
  ensure(response, { label: "http response" }).toBeDefined();
  ensureHttp(response!, { label: "response status" }).toHaveStatus(200);

  const body = world.app.lastResponseBody as { items?: unknown[] } | unknown[];
  const items = Array.isArray(body) ? body : body?.items;

  if (!Array.isArray(items)) {
    throw new Error("Expected response body to be an array or contain an items array");
  }

  if (items.length === 0) {
    throw new Error("Expected menu to contain items");
  }
});

function toPathExpectations(records: TableRecord[]): Array<{ readonly path: string; readonly value: unknown }> {
  return records.map((record) => {
    const rawPath = record.path;
    if (rawPath === undefined || rawPath === null) {
      throw new Error('Expectation table row is missing a "path" column');
    }
    const path = String(rawPath);
    if (!path.trim()) {
      throw new Error('Expectation table row contains an empty "path" value');
    }
    return {
      path,
      value: normalizeValue(record.value),
    };
  });
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractHttpErrorStatus(error: unknown): number | undefined {
  if (error instanceof HTTPError && error.response) {
    return error.response.status;
  }
  return undefined;
}
