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
  CucumberExpressionTypeMap,
  DefaultCucumberExpressionTypes,
  WithDefaultCucumberExpressionTypes,
} from "./types";

export function createScopes<
  World,
  ExpressionTypes extends CucumberExpressionTypeMap = DefaultCucumberExpressionTypes
>(
  options: CreateScopesOptions<World> = {}
): ScopesDsl<World, WithDefaultCucumberExpressionTypes<ExpressionTypes>> {
  const composer = new ScopeComposer<World>(options);
  type ExpressionMap = WithDefaultCucumberExpressionTypes<ExpressionTypes>;

  const feature = createFeatureBuilder(composer);
  const rule = createRuleBuilder(composer);
  const scenario = createScenarioBuilder(composer, "scenario");
  const scenarioOutline = createScenarioBuilder(composer, "scenarioOutline");

  const given = createStepBuilder<World, ExpressionMap>(composer, "Given");
  const when = createStepBuilder<World, ExpressionMap>(composer, "When");
  const then = createStepBuilder<World, ExpressionMap>(composer, "Then");
  const and = createStepBuilder<World, ExpressionMap>(composer, "And");
  const but = createStepBuilder<World, ExpressionMap>(composer, "But");

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

  const dsl: ScopesDsl<World, ExpressionMap> = {
    feature: feature as FeatureDsl<World>,
    rule,
    scenario,
    scenarioOutline,
    given,
    when,
    then,
    and,
    but,
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
