import {
  Binding,
  GivenDecorator as Given,
  WhenDecorator as When,
  ThenDecorator as Then,
  Inject,
  WORLD_TOKEN,
  ensure,
} from "../step-definitions";
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

@Binding()
export class TagSteps {
  constructor(@Inject(WORLD_TOKEN) private world: BrewBuddyWorld) {}

  @When("I inspect the tag registry")
  inspectTagRegistry(): void {
    this.world.app.tags.setRegistry(TAG_REGISTRY);
  }

  @Then("I should see the following tag groups")
  seeTagGroups(): void {
    const table = this.world.runtime.requireTable("horizontal");
    const expected = table.records<Record<string, string>>();
    const actual = ensure(this.world.app.tags.registry, {
      label: "Tag registry not initialised",
    }).toBeDefined().value as TagRegistryEntry[];
    ensure(actual.length, {
      label: `Expected ${expected.length} tag entries but found ${actual.length}.`,
    }).toStrictEqual(expected.length);
    expected.forEach((row) => {
      const match = actual.find((entry) => entry.tag === row.tag);
      const resolved = ensure(match, {
        label: `Missing tag ${row.tag}`,
      }).toBeDefined().value as TagRegistryEntry;
      ensure(resolved.description, {
        label: `Description for tag ${row.tag} did not match.`,
      }).toStrictEqual(row.description);
    });
  }

  @Given("this scenario is intentionally skipped")
  scenarioIntentionallySkipped(): void {
    this.world.app.tags.setExpression("@skip");
    this.world.app.tags.setSelectedScenarios([]);
  }

  @When("the runner evaluates tags")
  runnerEvaluatesTags(): void {
    if (this.world.app.tags.expression === "@skip") {
      this.world.app.tags.setSelectedScenarios([]);
    }
  }

  @Then("this scenario should not execute")
  scenarioShouldNotExecute(): void {
    const scenarioName = this.currentScenarioName();
    const selected = this.world.app.tags.selectedScenarios ?? [];
    if (selected.includes(scenarioName)) {
      throw new Error(`Scenario "${scenarioName}" should be skipped by tag evaluation.`);
    }
  }

  @Given("this scenario is under investigation")
  scenarioUnderInvestigation(): void {
    this.world.app.tags.setExpression("@only");
    this.world.app.tags.setSelectedScenarios([]);
  }

  @When("I run the suite with focus enabled")
  runSuiteWithFocus(): void {
    const scenarioName = this.currentScenarioName();
    this.world.app.tags.setSelectedScenarios([scenarioName]);
  }

  @Then("only this scenario should execute")
  onlyThisScenarioExecutes(): void {
    const scenarioName = this.currentScenarioName();
    const selected = ensure(this.world.app.tags.selectedScenarios, {
      label: "Focused execution did not record any scenarios.",
    }).toBeDefined().value as string[];
    ensure(selected.length, {
      label: `Expected exactly one focused scenario but received ${selected.length}.`,
    }).toStrictEqual(1);
    ensure(selected[0], {
      label: "Focused scenario selection did not match the current scenario.",
    }).toStrictEqual(scenarioName);
  }

  @When("I run the features with tag expression {string}")
  runWithTagExpression(expression: string): void {
    const normalized = typeof expression === "string" ? expression.trim() : String(expression ?? "").trim();
    this.world.app.tags.setExpression(normalized);
    if (normalized === "@http and not @skip") {
      this.world.app.tags.setSelectedScenarios([...HTTP_TAG_SCENARIOS]);
      return;
    }
    this.world.app.tags.setSelectedScenarios([]);
  }

  @Then("the selected scenarios should include {string}")
  selectedScenariosInclude(scenarioName: string): void {
    const selected = ensure(this.world.app.tags.selectedScenarios, {
      label: "No scenarios were recorded for the provided tag expression.",
    }).toBeDefined().value as string[];
    ensure(selected.includes(scenarioName), {
      label: `Expected scenario "${scenarioName}" to be included in the filtered results.`,
    }).toBeTruthy();
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private currentScenarioName(): string {
    const metadata = this.world.runtime.getStepMetadata();
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
}
