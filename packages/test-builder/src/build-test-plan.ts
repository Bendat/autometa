import type { ScopeExecutionAdapter } from "@autometa/scopes";
import type { SimpleFeature } from "@autometa/gherkin";
import type { BuildTestPlanOptions, TestPlan } from "./types";
import { TestPlanBuilder } from "./internal/test-plan-builder";
import { resolveFeatureScope } from "./internal/scope-resolution";

export function buildTestPlan<World>(options: BuildTestPlanOptions<World>): TestPlan<World> {
  const { feature, adapter } = options;
  assertFeature(feature);
  assertAdapter(adapter);

  const featureScope =
    options.featureScope ?? resolveFeatureScope(adapter, feature);

  return new TestPlanBuilder(feature, featureScope, adapter).build();
}

function assertFeature(feature: SimpleFeature | undefined): asserts feature is SimpleFeature {
  if (!feature) {
    throw new Error("A Gherkin feature is required to build a test plan");
  }
}

function assertAdapter<World>(
  adapter: ScopeExecutionAdapter<World> | undefined
): asserts adapter is ScopeExecutionAdapter<World> {
  if (!adapter) {
    throw new Error("A scope execution adapter is required to build a test plan");
  }
}
