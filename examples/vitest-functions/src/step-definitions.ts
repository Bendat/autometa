import { CucumberRunner, WORLD_TOKEN } from "@autometa/runner";
import { createDecorators, Scope } from "@autometa/injection";

import { brewBuddyWorldDefaults } from "./world";
import type { BrewBuddyWorldBase } from "./world";

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
  .withWorld<BrewBuddyWorldBase>(brewBuddyWorldDefaults)
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
