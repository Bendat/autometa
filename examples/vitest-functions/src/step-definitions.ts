import { getGlobalRunnerEnvironment } from "@autometa/runner";
import type { RunnerEnvironment, RunnerStepsSurface } from "@autometa/runner";

import type { BrewBuddyWorld } from "./world";

import type { HttpMethod } from "./utils/http";
import type { MenuExpectation, MenuRegion } from "./utils/regions";

interface BrewBuddyExpressionTypes extends Record<string, unknown> {
  readonly httpMethod: HttpMethod;
  readonly menuRegion: MenuRegion;
  readonly menuSelection: MenuExpectation;
  readonly menuSeasonal: boolean;
}

type BrewBuddyStepsSurface = RunnerStepsSurface<BrewBuddyWorld> & RunnerEnvironment<BrewBuddyWorld, BrewBuddyExpressionTypes>;

export const stepsEnvironment = getGlobalRunnerEnvironment() as unknown as BrewBuddyStepsSurface;

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
