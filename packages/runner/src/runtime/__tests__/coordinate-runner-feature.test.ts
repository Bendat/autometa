import { describe, expect, it, vi } from "vitest";
import type { ExecutorConfig } from "@autometa/config";
import type { ExecutorRuntime } from "@autometa/executor";
import type { SimpleFeature } from "@autometa/gherkin";
import type {
  ScopeExecutionAdapter,
  ScopeNode,
  ScopePlan,
} from "@autometa/scopes";
import type { CoordinateFeatureResult } from "@autometa/coordinator";
import type { TestPlan } from "@autometa/test-builder";

vi.mock("@autometa/coordinator", () => ({
  coordinateFeature: vi.fn(),
}));

import { coordinateFeature } from "@autometa/coordinator";

import {
  coordinateRunnerFeature,
  type CoordinateRunnerFeatureOptions,
} from "../coordinate-runner-feature";
import type { RunnerEnvironment } from "../../dsl/create-runner";

function createExecutorConfig(): ExecutorConfig {
  return {
    runner: "vitest",
    roots: {
      features: ["features"],
      steps: ["steps"],
    },
  };
}

function createSimpleFeature(name: string): SimpleFeature {
  return {
    id: `feature-${name}`,
    keyword: "Feature",
    language: "en",
    name,
    tags: [],
    elements: [],
    comments: [],
  };
}

function createScopeNode<World>(
  overrides?: Partial<ScopeNode<World>>
): ScopeNode<World> {
  return {
    id: "scope-id",
    kind: "feature",
    name: "scope",
    mode: "default",
    tags: [],
    steps: [],
    hooks: [],
    children: [],
    ...overrides,
  };
}

function createScopePlan<World>(
  overrides?: Partial<ScopePlan<World>>
): ScopePlan<World> {
  const root = overrides?.root ??
    createScopeNode<World>({ id: "root", kind: "root", name: "root" });
  return {
    root,
    stepsById: overrides?.stepsById ?? new Map(),
    hooksById: overrides?.hooksById ?? new Map(),
    scopesById:
      overrides?.scopesById ?? new Map([[root.id, root]]),
    ...(overrides?.worldFactory ? { worldFactory: overrides.worldFactory } : {}),
    ...(overrides?.parameterRegistry
      ? { parameterRegistry: overrides.parameterRegistry }
      : {}),
  };
}

function createAdapter<World>(plan: ScopePlan<World>): ScopeExecutionAdapter<World> {
  return {
    plan,
    features: plan.root.children,
    async createWorld() {
      return {} as World;
    },
    getScope: (id: string) => plan.scopesById.get(id),
    getSteps: () => [],
    getHooks: () => [],
    getAncestors: () => [],
    listScenarios: () => [],
    getParameterRegistry: () => plan.parameterRegistry,
  };
}

function createTestPlan<World>(
  featureScope: ScopeNode<World>,
  feature: SimpleFeature
): TestPlan<World> {
  return {
    feature: {
      type: "feature",
      name: feature.name,
      keyword: feature.keyword,
      feature,
      scope: featureScope,
      scenarios: [],
      scenarioOutlines: [],
      rules: [],
      listExecutables: () => [],
    },
    listExecutables: () => [],
    listFailed: () => [],
    findById: () => undefined,
    findByQualifiedName: () => undefined,
  };
}

describe("coordinateRunnerFeature", () => {
  it("coordinates using the environment plan by default", () => {
    interface World {
      value: number;
    }

    const feature = createSimpleFeature("default");
    const featureScope = createScopeNode<World>({
      id: "feature-scope",
      kind: "feature",
      name: feature.name,
    });
    const root = createScopeNode<World>({
      id: "root",
      kind: "root",
      name: "root",
      children: [featureScope],
    });
    const plan = createScopePlan<World>({
      root,
      scopesById: new Map([
        [root.id, root],
        [featureScope.id, featureScope],
      ]),
    });
    const adapter = createAdapter<World>(plan);
    const testPlan = createTestPlan<World>(featureScope, feature);
    const environment = {
      getPlan: () => plan,
    } as unknown as RunnerEnvironment<World>;
    const config = createExecutorConfig();
    const runtime = {
      suite: vi.fn(),
      test: vi.fn(),
    } as unknown as ExecutorRuntime;
    const register = (_runtime?: ExecutorRuntime) => {
      return undefined;
    };
    const result: CoordinateFeatureResult<World> = {
      feature,
      adapter,
      plan: testPlan,
      config,
      register,
    };
    vi.mocked(coordinateFeature).mockReturnValue(
      result as CoordinateFeatureResult<unknown>
    );

    const coordinated = coordinateRunnerFeature({
      environment,
      feature,
      config,
      runtime,
    });

    expect(coordinateFeature).toHaveBeenCalledWith({
      feature,
      scopePlan: plan,
      config,
      runtime,
    });
    expect(coordinated).toBe(result);
  });

  it("allows overriding plan and coordinator options", () => {
    const feature = createSimpleFeature("overrides");
    const featureScope = createScopeNode<unknown>({
      id: "feature-scope",
      kind: "feature",
      name: feature.name,
      tags: ["@focus"],
    });
    const root = createScopeNode<unknown>({
      id: "root",
      kind: "root",
      name: "root",
      children: [featureScope],
    });
    const plan = createScopePlan<unknown>({
      root,
      scopesById: new Map([
        [root.id, root],
        [featureScope.id, featureScope],
      ]),
    });

    const environment = {
      getPlan: vi.fn(),
    } as unknown as RunnerEnvironment<unknown>;
    const config = createExecutorConfig();
    const adapterFactory = vi.fn(
      (scopePlan: ScopePlan<unknown>) => createAdapter(scopePlan)
    ) as CoordinateRunnerFeatureOptions<unknown>["adapterFactory"];
    const planBuilder = vi.fn(
      (options: Parameters<NonNullable<CoordinateRunnerFeatureOptions<unknown>["planBuilder"]>>[0]) =>
        createTestPlan(
          (options.featureScope ??
            createScopeNode<unknown>({
              id: "builder-feature",
              kind: "feature",
              name: options.feature.name,
            })) as ScopeNode<unknown>,
          options.feature
        )
    ) as CoordinateRunnerFeatureOptions<unknown>["planBuilder"];
    const registerPlan = vi.fn() as CoordinateRunnerFeatureOptions<unknown>["registerPlan"];

    coordinateRunnerFeature({
      environment,
      feature,
      config,
      plan,
      adapterFactory,
      planBuilder,
      registerPlan,
      featureScope,
    });

    expect(coordinateFeature).toHaveBeenCalledWith({
      feature,
      scopePlan: plan,
      config,
      adapterFactory,
      planBuilder,
      registerPlan,
      featureScope,
    });
  });
});
