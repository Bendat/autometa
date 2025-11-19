import { ensure, Then, When } from "../step-definitions";
import { performRequest } from "../utils/http";
import { toPathExpectations } from "../utils/assertions";

When(
  "I send a {httpMethod} request to {string}",
  async (method, route, world) => {
    const payload = parseOptionalDocstring(world.runtime.consumeDocstring());
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
    ensure(world).response.hasStatus(status);
  }
);

Then(
  "the response header {string} should start with {string}",
  (header, prefix, world) => {
    ensure(world).response.hasHeader(header, (value) => value.startsWith(prefix));
  }
);

Then(
  /^the response header "([^"]+)" should equal "([^"]+)"$/,
  function (...args) {
    const [header, expected] = args;
    ensure(this).response.hasHeader(String(header), String(expected));
  }
);

Then(
  "the response json should contain",
  (world) => {
    const table = world.runtime.requireTable("horizontal");
    const expectations = toPathExpectations(table.records());
    ensure(world).json.contains(expectations);
  }
);

Then(
  "the response json should contain an array at path {string}",
  (path, world) => {
    ensure(world).json.array(path);
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
