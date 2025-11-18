import { CucumberRunner } from "@autometa/runner";
import type { RunnerStepsSurface } from "@autometa/runner";

import { createWorld } from "./world";
import type { BrewBuddyWorld, BrewBuddyWorldBase } from "./world";

import { BrewBuddyApp } from "./utils/http";
import type { HttpMethod } from "./utils/http";
import type { MenuExpectation, MenuRegion } from "./utils/regions";

interface BrewBuddyExpressionTypes extends Record<string, unknown> {
  readonly httpMethod: HttpMethod;
  readonly menuRegion: MenuRegion;
  readonly menuSelection: MenuExpectation;
  readonly menuSeasonal: boolean;
}

type BrewBuddyStepsSurface = RunnerStepsSurface<BrewBuddyWorld, BrewBuddyExpressionTypes>;

const runner = CucumberRunner.builder<BrewBuddyWorldBase>()
  .expressionMap<BrewBuddyExpressionTypes>()
  .withWorld(() => createWorld())
  .app(({ world }) => new BrewBuddyApp(world.http, world.baseUrl));

export const stepsEnvironment: BrewBuddyStepsSurface = runner.steps();

export const Given: BrewBuddyStepsSurface["Given"] = stepsEnvironment.Given;
export const When: BrewBuddyStepsSurface["When"] = stepsEnvironment.When;
export const Then: BrewBuddyStepsSurface["Then"] = stepsEnvironment.Then;
export const And: BrewBuddyStepsSurface["And"] = stepsEnvironment.And;
export const But: BrewBuddyStepsSurface["But"] = stepsEnvironment.But;

export const BeforeScenario: BrewBuddyStepsSurface["BeforeScenario"] =
  stepsEnvironment.BeforeScenario;
export const AfterScenario: BrewBuddyStepsSurface["AfterScenario"] =
  stepsEnvironment.AfterScenario;
export const BeforeScenarioOutline: BrewBuddyStepsSurface["BeforeScenarioOutline"] =
  stepsEnvironment.BeforeScenarioOutline;
export const AfterScenarioOutline: BrewBuddyStepsSurface["AfterScenarioOutline"] =
  stepsEnvironment.AfterScenarioOutline;
export const BeforeStep: BrewBuddyStepsSurface["BeforeStep"] =
  stepsEnvironment.BeforeStep;
export const AfterStep: BrewBuddyStepsSurface["AfterStep"] =
  stepsEnvironment.AfterStep;

export const BeforeFeature: BrewBuddyStepsSurface["BeforeFeature"] =
  stepsEnvironment.BeforeFeature;
export const AfterFeature: BrewBuddyStepsSurface["AfterFeature"] =
  stepsEnvironment.AfterFeature;

export const defineParameterType: BrewBuddyStepsSurface["defineParameterType"] =
  stepsEnvironment.defineParameterType;
export const defineParameterTypes: BrewBuddyStepsSurface["defineParameterTypes"] =
  stepsEnvironment.defineParameterTypes;
export const lookupParameterType: BrewBuddyStepsSurface["lookupParameterType"] =
  stepsEnvironment.lookupParameterType;
