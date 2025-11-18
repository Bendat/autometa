import { CucumberRunner } from "@autometa/runner";

import { brewBuddyWorldDefaults } from "./world";
import type { BrewBuddyWorldBase } from "./world";

import { BrewBuddyApp } from "./utils/http";
import type { HttpMethod } from "./utils/http";
import type { MenuExpectation, MenuRegion } from "./utils/regions";

interface BrewBuddyExpressionTypes extends Record<string, unknown> {
  readonly httpMethod: HttpMethod;
  readonly menuRegion: MenuRegion;
  readonly menuSelection: MenuExpectation;
  readonly menuSeasonal: boolean;
}

const runner = CucumberRunner.builder()
  .expressionMap<BrewBuddyExpressionTypes>()
  .withWorld<BrewBuddyWorldBase>(brewBuddyWorldDefaults)
  .app(({ world }) => new BrewBuddyApp(world.http, world.baseUrl, () => world));
  
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
} = stepsEnvironment;
