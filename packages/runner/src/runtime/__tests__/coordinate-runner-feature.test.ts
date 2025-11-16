import { describe, expect, it, vi } from "vitest";
import type { ExecutorConfig } from "@autometa/config";
import type { ExecutorRuntime } from "@autometa/executor";
import type { SimpleFeature } from "@autometa/gherkin";
import type { ScopePlan } from "@autometa/scopes";

vi.mock("@autometa/coordinator", () => ({
  coordinateFeature: vi.fn(),
}));

import { coordinateFeature } from "@autometa/coordinator";

import { coordinateRunnerFeature } from "../coordinate-runner-feature";
import type { RunnerEnvironment } from "../../dsl/create-runner";

describe("coordinateRunnerFeature", () => {
  it("coordinates using the environment plan by default", () => {
    interface World {
      value: number;
    }
    const root = {
      id: "root",
      kind: "root" as const,
      name: "root",
      mode: "default" as const,
      tags: [],
      steps: [],
      hooks: [],
      children: [],
    } satisfies ScopePlan<World>["root"];
    const plan: ScopePlan<World> = {
      root,
      stepsById: new Map(),
      hooksById: new Map(),
      scopesById: new Map([[root.id, root]]),
    };
    const environment = {
      getPlan: () => plan,
    } as unknown as RunnerEnvironment<World>;
    const feature = { name: "Feature" } as unknown as SimpleFeature;
    const config = { retries: 0 } as unknown as ExecutorConfig;
    const runtime = {
      suite: vi.fn(),
      test: vi.fn(),
    } as unknown as ExecutorRuntime;
    const result = {
      feature,
      adapter: { plan },
      plan,
      config,
      register: vi.fn(),
    };
    vi.mocked(coordinateFeature).mockReturnValue(result);

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
    const plan = {
      root: {
        id: "root",
        kind: "root" as const,
        name: "root",
        mode: "default" as const,
        tags: [],
        steps: [],
        hooks: [],
        children: [],
      },
      stepsById: new Map(),
      hooksById: new Map(),
      scopesById: new Map(),
    } satisfies ScopePlan<unknown>;

    const environment = {
      getPlan: vi.fn(),
    } as unknown as RunnerEnvironment<unknown>;
    const feature = { name: "Feature" } as unknown as SimpleFeature;
    const config = {} as ExecutorConfig;
    const adapterFactory = vi.fn();
    const planBuilder = vi.fn();
    const registerPlan = vi.fn();
    const featureScope = { tags: ["@focus"] };

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
