import {
  Binding,
  WhenDecorator as When,
  ThenDecorator as Then,
  Inject,
  WORLD_TOKEN,
  ensure,
} from "../step-definitions";
import { extractErrorStatus, performRequest, type HttpMethodInput } from "../utils";
import { toPathExpectations } from "../utils/assertions";
import type { BrewBuddyWorld } from "../world";
import type { MenuItem } from "../../../.api/src/types/domain.js";

@Binding()
export class RequestSteps {
  constructor(@Inject(WORLD_TOKEN) private world: BrewBuddyWorld) {}

  @When("I send a {httpMethod} request to {string}")
  async sendRequest(method: HttpMethodInput, route: string): Promise<void> {
    const payload = this.parseOptionalDocstring(this.world.runtime.consumeDocstring());
    const requestOptions = payload === undefined ? {} : { body: payload };
    try {
      await performRequest(this.world, method, route, requestOptions);
    } catch (error) {
      const status = extractErrorStatus(this.world);
      if (status === undefined) {
        throw error;
      }
    }
  }

  @Then("the response status should be {int}")
  responseStatusIs(status: number): void {
    ensure.response.hasStatus(status);
  }

  @Then("the response status should not be {int}")
  responseStatusIsNot(status: number): void {
    ensure.not.response.hasStatus(status);
  }

  @Then("the response header {string} should start with {string}")
  responseHeaderStartsWith(header: string, prefix: string): void {
    ensure.response.hasHeader(header, (value) => value.startsWith(prefix));
  }

  @Then(/^the response header "([^"]+)" should not equal "([^"]+)"$/)
  responseHeaderNotEquals(header: string, unexpected: string): void {
    ensure.response.hasHeaderNot(header, (value) => value === unexpected);
  }

  @Then(/^the response header "([^"]+)" should equal "([^"]+)"$/)
  responseHeaderEquals(header: string, expected: string): void {
    ensure.response.hasHeader(header, (value) => value === expected);
  }

  @Then("the response json should contain")
  responseJsonContains(): void {
    const table = this.world.runtime.requireTable("horizontal");
    const expectations = toPathExpectations(table.records());
    ensure.json.contains(expectations);
  }

  @Then("the response json should contain an array at path {string}")
  responseJsonArrayAtPath(path: string): void {
    ensure.json.array(path);
  }

  @Then("the response json should match the default menu snapshot")
  responseMatchesMenuSnapshot(): void {
    ensure.response.hasStatus(200);
    const body = this.world.app.lastResponseBody as { items?: unknown[] } | unknown[];

    const items = Array.isArray(body) ? body : body?.items;

    if (!Array.isArray(items)) {
      throw new Error("Expected response body to be an array or contain an items array");
    }

    if (items.length === 0) {
      throw new Error("Expected menu to contain items");
    }

    const menuSnapshot = items.filter(this.isMenuItem) as MenuItem[];
    this.world.scenario.menuSnapshot = menuSnapshot;
  }

  @Then(/^each recipe should include fields (.+)$/)
  eachRecipeIncludesFields(fieldsRaw: string): void {
    const matches = Array.from(fieldsRaw.matchAll(/"([^"]+)"/g))
      .map(([, field]) => field)
      .filter((field): field is string => typeof field === "string" && field.length > 0);

    if (matches.length === 0) {
      throw new Error(`Expected at least one quoted field name in: ${fieldsRaw}`);
    }

    const body = this.world.app.lastResponseBody as { recipes?: unknown } | undefined;
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

  // ============================================================================
  // HELPERS
  // ============================================================================

  private isMenuItem(value: unknown): value is MenuItem {
    if (!value || typeof value !== "object") {
      return false;
    }
    const candidate = value as Partial<MenuItem>;
    return typeof candidate.name === "string" && typeof candidate.price === "number";
  }

  private parseOptionalDocstring(docstring: string | undefined): unknown {
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
}
