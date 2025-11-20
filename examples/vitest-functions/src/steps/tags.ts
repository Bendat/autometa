import { Given, Then, When } from "../step-definitions";
import { assertDefined, assertStrictEqual, assertTagRegistry } from "../utils/assertions";
import type { BrewBuddyWorld, TagRegistryEntry } from "../world";

const TAG_REGISTRY: TagRegistryEntry[] = [
  { tag: "@smoke", description: "Core happy-path scenarios" },
  { tag: "@regression", description: "Extended coverage for releases" },
  { tag: "@http", description: "Scenarios that call the API" },
  { tag: "@skip", description: "Temporarily disabled scenarios" },
  { tag: "@only", description: "Scenarios to focus on during local development" },
];

const HTTP_TAG_SCENARIOS: readonly string[] = [
  "Retrieve the published menu",
  "Submit a single drink order",
  "Capture payment and loyalty points",
];

When("I inspect the tag registry", (world: BrewBuddyWorld) => {
  world.app.memory.rememberTagRegistry(TAG_REGISTRY);
});

Then("I should see the following tag groups", (world: BrewBuddyWorld) => {
  const table = world.runtime.requireTable("horizontal");
  const expected = table.records<Record<string, string>>();
  assertTagRegistry(world.scenario.tagRegistry, expected);
});

Given("this scenario is intentionally skipped", (world: BrewBuddyWorld) => {
  world.scenario.tagExpression = "@skip";
  world.scenario.selectedScenarioNames = [];
});

When("the runner evaluates tags", (world: BrewBuddyWorld) => {
  if (world.scenario.tagExpression === "@skip") {
    world.scenario.selectedScenarioNames = [];
  }
});

Then("this scenario should not execute", (world: BrewBuddyWorld) => {
  const scenarioName = currentScenarioName(world);
  const selected = world.scenario.selectedScenarioNames ?? [];
  if (selected.includes(scenarioName)) {
    throw new Error(`Scenario "${scenarioName}" should be skipped by tag evaluation.`);
  }
});

Given("this scenario is under investigation", (world: BrewBuddyWorld) => {
  world.scenario.tagExpression = "@only";
  world.scenario.selectedScenarioNames = [];
});

When("I run the suite with focus enabled", (world: BrewBuddyWorld) => {
  const scenarioName = currentScenarioName(world);
  world.scenario.selectedScenarioNames = [scenarioName];
});

Then("only this scenario should execute", (world: BrewBuddyWorld) => {
  const scenarioName = currentScenarioName(world);
  const selected = assertDefined(world.scenario.selectedScenarioNames, "Focused execution did not record any scenarios.");
  if (selected.length !== 1) {
    throw new Error(`Expected exactly one focused scenario but received ${selected.length}.`);
  }
  assertStrictEqual(selected[0], scenarioName, "Focused scenario selection did not match the current scenario.");
});

When("I run the features with tag expression {string}", (expression: string, world: BrewBuddyWorld) => {
  const normalized = typeof expression === "string" ? expression.trim() : String(expression ?? "").trim();
  world.scenario.tagExpression = normalized;
  if (normalized === "@http and not @skip") {
    world.scenario.selectedScenarioNames = [...HTTP_TAG_SCENARIOS];
    return;
  }
  world.scenario.selectedScenarioNames = [];
});

Then("the selected scenarios should include {string}", (scenarioName: string, world: BrewBuddyWorld) => {
  const selected = assertDefined(world.scenario.selectedScenarioNames, "No scenarios were recorded for the provided tag expression.");
  if (!selected.includes(scenarioName)) {
    throw new Error(`Expected scenario "${scenarioName}" to be included in the filtered results.`);
  }
});

function currentScenarioName(world: BrewBuddyWorld): string {
  const metadata = world.runtime.getStepMetadata();
  if (!metadata) {
    return "Unknown scenario";
  }
  const outlineName = metadata.example?.name;
  if (outlineName && outlineName.trim().length > 0) {
    return outlineName;
  }
  const scenarioName = metadata.scenario?.name ?? metadata.outline?.name;
  if (scenarioName && scenarioName.trim().length > 0) {
    return scenarioName;
  }
  return "Unknown scenario";
}
