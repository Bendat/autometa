import { ScopeComposer } from "./scope-composer";
import {
  createFeatureBuilder,
  createHookBuilder,
  createRuleBuilder,
  createScenarioBuilder,
  createStepBuilder,
} from "./dsl-builders";
import type {
  CreateScopesOptions,
  FeatureDsl,
  HookDsl,
  ScopePlan,
  ScopesDsl,
  StepDsl,
} from "./types";

export function createScopes<World>(options: CreateScopesOptions<World> = {}): ScopesDsl<World> {
  const composer = new ScopeComposer<World>(options);

  const feature = createFeatureBuilder(composer);
  const rule = createRuleBuilder(composer);
  const scenario = createScenarioBuilder(composer, "scenario");
  const scenarioOutline = createScenarioBuilder(composer, "scenarioOutline");

  const given = createStepBuilder(composer, "Given");
  const when = createStepBuilder(composer, "When");
  const then = createStepBuilder(composer, "Then");
  const and = createStepBuilder(composer, "And");
  const but = createStepBuilder(composer, "But");

  const beforeFeature = createHookBuilder(composer, "beforeFeature");
  const afterFeature = createHookBuilder(composer, "afterFeature");
  const beforeRule = createHookBuilder(composer, "beforeRule");
  const afterRule = createHookBuilder(composer, "afterRule");
  const beforeScenario = createHookBuilder(composer, "beforeScenario");
  const afterScenario = createHookBuilder(composer, "afterScenario");
  const beforeScenarioOutline = createHookBuilder(composer, "beforeScenarioOutline");
  const afterScenarioOutline = createHookBuilder(composer, "afterScenarioOutline");
  const beforeStep = createHookBuilder(composer, "beforeStep");
  const afterStep = createHookBuilder(composer, "afterStep");

  const plan = (): ScopePlan<World> => composer.plan;

  const dsl: ScopesDsl<World> = {
    feature: feature as FeatureDsl<World>,
    rule,
    scenario,
    scenarioOutline,
    given: given as StepDsl<World>,
    when: when as StepDsl<World>,
    then: then as StepDsl<World>,
    and: and as StepDsl<World>,
    but: but as StepDsl<World>,
    beforeFeature: beforeFeature as HookDsl<World>,
    afterFeature: afterFeature as HookDsl<World>,
    beforeRule: beforeRule as HookDsl<World>,
    afterRule: afterRule as HookDsl<World>,
    beforeScenario: beforeScenario as HookDsl<World>,
    afterScenario: afterScenario as HookDsl<World>,
    beforeScenarioOutline: beforeScenarioOutline as HookDsl<World>,
    afterScenarioOutline: afterScenarioOutline as HookDsl<World>,
    beforeStep: beforeStep as HookDsl<World>,
    afterStep: afterStep as HookDsl<World>,
    plan,
  };

  return dsl;
}
