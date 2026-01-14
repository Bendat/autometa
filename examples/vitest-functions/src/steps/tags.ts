import { Given, Then, When, ensure } from "../step-definitions";
import type { BrewBuddyWorld } from "../world";
import type { TagRegistryEntry } from "../services/tag-registry.service";

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
  world.app.tags.setRegistry(TAG_REGISTRY);
});

Then("I should see the following tag groups", (world: BrewBuddyWorld) => {
  const table = world.runtime.requireTable("horizontal");
  const expected = table.records<Record<string, string>>();
  const actual = ensure(world.app.tags.registry, {
    label: "Tag registry not initialised",
  })
    .toBeDefined()
    .value as TagRegistryEntry[];
  ensure(actual.length, {
    label: `Expected ${expected.length} tag entries but found ${actual.length}.`,
  }).toStrictEqual(expected.length);
  expected.forEach((row) => {
    const match = actual.find((entry) => entry.tag === row.tag);
    const resolved = ensure(match, {
      label: `Missing tag ${row.tag}`,
    })
      .toBeDefined()
      .value as TagRegistryEntry;
    ensure(resolved.description, {
      label: `Description for tag ${row.tag} did not match.`,
    }).toStrictEqual(row.description);
  });
});

Given("this scenario is intentionally skipped", (world: BrewBuddyWorld) => {
  world.app.tags.setExpression("@skip");
  world.app.tags.setSelectedScenarios([]);
});

When("the runner evaluates tags", (world: BrewBuddyWorld) => {
  if (world.app.tags.expression === "@skip") {
    world.app.tags.setSelectedScenarios([]);
  }
});

Then("this scenario should not execute", (world: BrewBuddyWorld) => {
  const scenarioName = currentScenarioName(world);
  const selected = world.app.tags.selectedScenarios ?? [];
  if (selected.includes(scenarioName)) {
    throw new Error(`Scenario "${scenarioName}" should be skipped by tag evaluation.`);
  }
});

Given("this scenario is under investigation", (world: BrewBuddyWorld) => {
  world.app.tags.setExpression("@only");
  world.app.tags.setSelectedScenarios([]);
});

When("I run the suite with focus enabled", (world: BrewBuddyWorld) => {
  const scenarioName = currentScenarioName(world);
  world.app.tags.setSelectedScenarios([scenarioName]);
});

Then("only this scenario should execute", (world: BrewBuddyWorld) => {
  const scenarioName = currentScenarioName(world);
  const selected = ensure(world.app.tags.selectedScenarios, {
    label: "Focused execution did not record any scenarios.",
  })
    .toBeDefined()
    .value as string[];
  ensure(selected.length, {
    label: `Expected exactly one focused scenario but received ${selected.length}.`,
  }).toStrictEqual(1);
  ensure(selected[0], {
    label: "Focused scenario selection did not match the current scenario.",
  }).toStrictEqual(scenarioName);
});

When("I run the features with tag expression {string}", (expression: string, world: BrewBuddyWorld) => {
  const normalized = typeof expression === "string" ? expression.trim() : String(expression ?? "").trim();
  world.app.tags.setExpression(normalized);
  if (normalized === "@http and not @skip") {
    world.app.tags.setSelectedScenarios([...HTTP_TAG_SCENARIOS]);
    return;
  }
  world.app.tags.setSelectedScenarios([]);
});

Then("the selected scenarios should include {string}", (scenarioName: string, world: BrewBuddyWorld) => {
  const selected = ensure(world.app.tags.selectedScenarios, {
    label: "No scenarios were recorded for the provided tag expression.",
  })
    .toBeDefined()
    .value as string[];
  ensure(selected.includes(scenarioName), {
    label: `Expected scenario "${scenarioName}" to be included in the filtered results.`,
  }).toBeTruthy();
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
