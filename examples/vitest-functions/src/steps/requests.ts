import { createStepRuntime } from "@autometa/executor";

import { Then, When } from "../step-definitions";
import { performRequest } from "../utils/http";
import {
  assertHeaderEquals,
  assertHeaderStartsWith,
  assertJsonArray,
  assertJsonContains,
  assertStatus,
  toPathExpectations,
} from "../utils/assertions";
import { consumeHorizontalTable } from "../utils/tables";

When(
  "I send a {httpMethod} request to {string}",
  async (method, route, world) => {
    const runtime = createStepRuntime(world);
    const payload = parseOptionalDocstring(runtime.consumeDocstring());
    await performRequest(
      world,
      method,
      route,
      payload === undefined ? {} : { body: payload }
    );
  }
);

Then(
  "the response status should be {int}",
  (status, world) => {
    assertStatus(world, status);
  }
);

Then(
  "the response header {string} should start with {string}",
  (header, prefix, world) => {
    assertHeaderStartsWith(world, header, prefix);
  }
);

Then(
  /^the response header "([^"]+)" should equal "([^"]+)"$/,
  function (...args) {
    const [header, expected] = args;
    assertHeaderEquals(this, String(header), String(expected));
  }
);

Then(
  "the response json should contain",
  (world) => {
    const runtime = createStepRuntime(world);
    const rows = consumeHorizontalTable(runtime);
    assertJsonContains(world, toPathExpectations(rows));
  }
);

Then(
  "the response json should contain an array at path {string}",
  (path, world) => {
    assertJsonArray(world, path);
  }
);

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
