import { CucumberRunner, WORLD_TOKEN } from "@autometa/runner";
import { createDecorators, Scope } from "@autometa/injection";

import {
  createBrewBuddyWorld,
  type BrewBuddyWorldBase,
  type LifecycleStepRecord,
  type StepLifecycleStatus,
} from "./world";

// Import parameter types to register custom cucumber expression types
import "./support/parameter-types";

import { BrewBuddyApp } from "./utils/http";
import { BrewBuddyMemoryService } from "./utils/memory";
import type { HttpMethod } from "./utils/http";
import type { MenuExpectation, MenuRegion } from "./utils/regions";
import { createBrewBuddyEnsureFactory } from "./utils/assertions";

interface BrewBuddyExpressionTypes extends Record<string, unknown> {
  readonly httpMethod: HttpMethod;
  readonly menuRegion: MenuRegion;
  readonly menuSelection: MenuExpectation;
  readonly menuSeasonal: boolean;
}

const runner = CucumberRunner.builder()
  .expressionMap<BrewBuddyExpressionTypes>()
  .withWorld<BrewBuddyWorldBase>(createBrewBuddyWorld)
  .app(({ container, world }) => {
    const decorators = createDecorators(container);
    decorators.LazyInject(WORLD_TOKEN)(
      BrewBuddyMemoryService.prototype,
      "world"
    );
    decorators.Injectable({ scope: Scope.SCENARIO })(BrewBuddyMemoryService);
    const memory = container.resolve(BrewBuddyMemoryService);
    return new BrewBuddyApp(world.http, world.baseUrl, memory);
  })
  .assertions(createBrewBuddyEnsureFactory);
  
export const stepsEnvironment = runner.steps();

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
  defineParameterType,
  defineParameterTypes,
  lookupParameterType,
  ensure,
} = stepsEnvironment;

interface HookMetadata {
  readonly scenario?: { readonly name?: string };
  readonly step?: {
    readonly index?: number;
    readonly keyword?: string;
    readonly text?: string;
    readonly status?: StepLifecycleStatus;
  };
}

BeforeFeature(({ world, scope }) => {
  world.lifecycle.featureName = scope.name;
  world.lifecycle.beforeFeatureRuns += 1;
  console.info(`[lifecycle] beforeFeature → ${scope.name}`);
});

AfterFeature(({ world }) => {
  world.lifecycle.afterFeatureRuns += 1;
  console.info(`[lifecycle] afterFeature → ${world.lifecycle.featureName ?? "<unknown>"}`);
});

BeforeScenario(({ world, scope, metadata }) => {
  const details = (metadata ?? {}) as HookMetadata;
  const scenarioName = details.scenario?.name ?? scope.name;
  if (!world.lifecycle.scenarioOrder.includes(scenarioName)) {
    world.lifecycle.scenarioOrder.push(scenarioName);
  }
  console.info(`[lifecycle] beforeScenario → ${scenarioName}`);
});

AfterStep(({ world, scope, metadata }) => {
  const details = (metadata ?? {}) as HookMetadata;
  const scenarioName = details.scenario?.name ?? scope.name;
  const step = details.step;
  if (!step) {
    return;
  }

  const keyword = step.keyword?.trim() ?? "";
  const text = step.text ?? "";
  const label = keyword ? `${keyword}${text.startsWith(" ") ? "" : " "}${text}` : text || `${step.keyword ?? "Step"} #${step.index ?? 0}`;
  const entry: LifecycleStepRecord = {
    scenario: scenarioName,
    step: label,
    status: (step.status as StepLifecycleStatus | undefined) ?? "passed",
  };

  world.lifecycle.stepHistory.push(entry);
  console.info(`[lifecycle] afterStep → ${scenarioName} :: ${label} (${entry.status})`);
});

