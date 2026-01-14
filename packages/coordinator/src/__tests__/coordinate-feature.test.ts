import { describe, expect, it, vi } from "vitest";
import { AutomationError } from "@autometa/errors";
import type { ExecutorConfig } from "@autometa/config";
import type {
  ScopeExecutionAdapter,
  ScopeNode,
  ScopePlan,
} from "@autometa/scopes";
import type { SimpleFeature } from "@autometa/gherkin";
import type {
  BuildTestPlanOptions,
  FeatureNode,
  TestPlan,
} from "@autometa/test-builder";
import type { ExecutorRuntime } from "@autometa/executor";
import { coordinateFeature } from "../index";

describe("coordinateFeature", () => {
  interface WorldShape {
    readonly id: string;
  }

  const featureScope = createFeatureScope();
  const scopePlan = createScopePlan(featureScope);
  const feature: SimpleFeature = {
    name: "Example Feature",
    keyword: "Feature",
    uri: "features/example.feature",
    tags: [],
    elements: [],
  };
  const config: ExecutorConfig = {
    runner: "vitest",
    roots: {
      features: ["features"],
      steps: ["steps"],
    },
  };

  it("builds a plan and registers it with the provided runtime", () => {
    const adapter: ScopeExecutionAdapter<WorldShape> = createAdapterStub(scopePlan);
    const plan = createPlanStub(featureScope, feature);

    let capturedBuildOptions: BuildTestPlanOptions<WorldShape> | undefined;
    const adapterFactory = vi.fn(() => adapter);
    const planBuilder = vi.fn<(options: BuildTestPlanOptions<WorldShape>) => TestPlan<WorldShape>>(
      (options) => {
        capturedBuildOptions = options;
        return plan;
      }
    );
    const registerPlan = vi.fn();
    const runtime = createRuntimeStub();

    const result = coordinateFeature<WorldShape>({
      feature,
      scopePlan,
      config,
      runtime,
      featureScope,
      adapterFactory,
      planBuilder,
      registerPlan,
    });

    expect(adapterFactory).toHaveBeenCalledOnce();
    expect(adapterFactory).toHaveBeenCalledWith(scopePlan);
    expect(planBuilder).toHaveBeenCalledOnce();

    expect(capturedBuildOptions).toBeDefined();
    expect(capturedBuildOptions?.feature).toBe(feature);
    expect(capturedBuildOptions?.adapter).toBe(adapter);
    expect(capturedBuildOptions?.featureScope).toBe(featureScope);

    expect(result.plan).toBe(plan);
    expect(result.adapter).toBe(adapter);
    expect(result.config).toBe(config);

    result.register();

    expect(registerPlan).toHaveBeenCalledOnce();
    expect(registerPlan).toHaveBeenCalledWith({
      plan,
      adapter,
      runtime,
      config,
    });
  });

  it("throws when no runtime is available during registration", () => {
    const adapter: ScopeExecutionAdapter<WorldShape> = createAdapterStub(scopePlan);
    const plan = createPlanStub(featureScope, feature);
    const adapterFactory = vi.fn(() => adapter);
    const planBuilder = vi.fn<(options: BuildTestPlanOptions<WorldShape>) => TestPlan<WorldShape>>(
      () => plan
    );
    const registerPlan = vi.fn();

    const result = coordinateFeature<WorldShape>({
      feature,
      scopePlan,
      config,
      featureScope,
      adapterFactory,
      planBuilder,
      registerPlan,
    });

    expect(() => result.register()).toThrowError(AutomationError);
    expect(registerPlan).not.toHaveBeenCalled();
  });
});

function createFeatureScope(): ScopeNode<{ readonly id: string }> {
  return {
    id: "feature-1",
    kind: "feature",
    name: "Example Feature",
    mode: "default",
    tags: [],
    steps: [],
    hooks: [],
    children: [],
  };
}

function createScopePlan<World>(featureScope: ScopeNode<World>): ScopePlan<World> {
  const root: ScopeNode<World> = {
    id: "root-scope",
    kind: "root",
    name: "root",
    mode: "default",
    tags: [],
    steps: [],
    hooks: [],
    children: [featureScope],
  };

  return {
    root,
    stepsById: new Map(),
    hooksById: new Map(),
    scopesById: new Map([
      [root.id, root],
      [featureScope.id, featureScope],
    ]),
  };
}

function createPlanStub<World>(
  featureScope: ScopeNode<World>,
  feature: SimpleFeature
): TestPlan<World> {
  const planFeature: FeatureNode<World> = {
    type: "feature",
    name: feature.name,
    keyword: feature.keyword ?? "Feature",
    feature,
    scope: featureScope,
    scenarios: [],
    scenarioOutlines: [],
    rules: [],
    listExecutables: () => [],
  };

  return {
    feature: planFeature,
    listExecutables: () => [],
    listFailed: () => [],
    findById: () => undefined,
    findByQualifiedName: () => undefined,
  };
}

function createAdapterStub<World>(plan: ScopePlan<World>): ScopeExecutionAdapter<World> {
  return {
    plan,
    features: plan.root.children,
    async createWorld(_scope) {
      return { id: "world" } as unknown as World;
    },
    getScope: () => undefined,
    getSteps: () => [],
    getHooks: () => [],
    getAncestors: () => [],
    listScenarios: () => [],
    getParameterRegistry: () => undefined,
  };
}

function createRuntimeStub(): ExecutorRuntime {
  const noop = () => undefined;
  const suiteImpl = (title: string, handler: () => void, _timeout?: number) => {
    handler();
  };
  const testImpl = async (
    title: string,
    handler: () => void | Promise<void>,
    _timeout?: number
  ) => {
    await handler();
  };

  const suite = Object.assign(suiteImpl, {
    skip: suiteImpl,
    only: suiteImpl,
  });
  const test = Object.assign(testImpl, {
    skip: testImpl,
    only: testImpl,
  });

  return {
    suite,
    test,
    beforeAll: noop,
    afterAll: noop,
    beforeEach: noop,
    afterEach: noop,
    currentTestName: () => undefined,
  };
}
