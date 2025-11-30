import "reflect-metadata";
import { CucumberRunner, WORLD_TOKEN } from "@autometa/runner";
import {
  brewBuddyWorldDefaults,
  type BrewBuddyWorldBase,
  type LifecycleStepRecord,
  type StepLifecycleStatus,
} from "./world";
import type { HttpMethod } from "./utils/http";
import type { MenuExpectation, MenuRegion } from "./utils/regions";
import { brewBuddyPlugins } from "./utils/assertions";
import { CompositionRoot } from "./composition/brew-buddy-app";
import { brewBuddyParameterTypes } from "./support/parameter-types";

// ============================================================================
// RUNNER SETUP
// ============================================================================

interface BrewBuddyExpressionTypes extends Record<string, unknown> {
  readonly httpMethod: HttpMethod;
  readonly menuRegion: MenuRegion;
  readonly menuSelection: MenuExpectation;
  readonly menuSeasonal: boolean;
}

const runner = CucumberRunner.builder()
  .expressionMap<BrewBuddyExpressionTypes>()
  .withWorld<BrewBuddyWorldBase>(brewBuddyWorldDefaults)
  .app(CompositionRoot)
  .assertionPlugins(brewBuddyPlugins)
  .parameterTypes(brewBuddyParameterTypes);

/**
 * Steps environment - required export for the vitest-plugin to find.
 */
export const stepsEnvironment = runner.steps();

/**
 * Function-based step exports for mixed usage
 */
export const {
  Given,
  When,
  Then,
  And,
  But,
  BeforeScenario,
  AfterScenario,
  BeforeScenarioOutline,
  AfterScenarioOutline,
  BeforeStep,
  AfterStep,
  BeforeFeature,
  AfterFeature,
  ensure,
} = stepsEnvironment;

/**
 * Get decorator-based step definitions with DI support.
 * This provides @Binding, @Given, @When, @Then, @Injectable, @Inject decorators.
 */
export const {
  Binding,
  Given: GivenDecorator,
  When: WhenDecorator,
  Then: ThenDecorator,
  And: AndDecorator,
  But: ButDecorator,
  Injectable,
  Inject,
  LazyInject,
} = runner.bindingsTS();

// Re-export WORLD_TOKEN for convenience
export { WORLD_TOKEN };

// ============================================================================
// LIFECYCLE HOOKS
// ============================================================================

interface HookMetadata {
  readonly scenario?: { readonly name?: string };
  readonly step?: {
    readonly index?: number;
    readonly keyword?: string;
    readonly text?: string;
    readonly status?: StepLifecycleStatus;
  };
}

function writeLifecycleLog(
  logger: ((message: string) => void) | undefined,
  message: string
): void {
  if (logger) {
    logger(message);
    return;
  }
  console.info(message);
}

BeforeFeature(({ world, scope, log }) => {
  world.lifecycle.featureName = scope.name;
  world.lifecycle.beforeFeatureRuns += 1;
  writeLifecycleLog(log, `Preparing "${scope.name}"`);
});

AfterFeature(({ world, log }) => {
  world.lifecycle.afterFeatureRuns += 1;
  writeLifecycleLog(
    log,
    `Finished "${world.lifecycle.featureName ?? "<unknown>"}"`
  );
});

BeforeScenario(({ world, scope, metadata, log }) => {
  const details = (metadata ?? {}) as HookMetadata;
  const scenarioName = details.scenario?.name ?? scope.name;
  if (!world.lifecycle.scenarioOrder.includes(scenarioName)) {
    world.lifecycle.scenarioOrder.push(scenarioName);
  }
  writeLifecycleLog(log, `Scenario "${scenarioName}" ready`);
});

AfterStep(({ world, scope, metadata, log }) => {
  const details = (metadata ?? {}) as HookMetadata;
  const scenarioName = details.scenario?.name ?? scope.name;
  const step = details.step;
  if (!step) {
    return;
  }

  const keyword = step.keyword?.trim() ?? "";
  const text = step.text ?? "";
  const label = keyword
    ? `${keyword}${text.startsWith(" ") ? "" : " "}${text}`
    : text || `${step.keyword ?? "Step"} #${step.index ?? 0}`;
  const entry: LifecycleStepRecord = {
    scenario: scenarioName,
    step: label,
    status: (step.status as StepLifecycleStatus | undefined) ?? "passed",
  };

  world.lifecycle.stepHistory.push(entry);
  writeLifecycleLog(
    log,
    `Scenario "${scenarioName}" :: ${label} (${entry.status})`
  );
});

// Clean up stream manager after each scenario
AfterScenario(({ world }) => {
  world.app.streamManager.dispose();
});

