import { promises as fs } from "node:fs";
import { join } from "node:path";

import type { ExecutorConfig } from "@autometa/config";
import type { LoadedExecutorConfig } from "../loaders/config";
import type { RuntimeSummary } from "../runtime/cli-runtime";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { runFeatures } from "./run";

const loadExecutorConfigMock = vi.fn();
const expandFilePatternsMock = vi.fn();
const loadModuleMock = vi.fn();
const cucumberRunnerBuilderMock = vi.fn();
const parseGherkinMock = vi.fn();
const createCliRuntimeMock = vi.fn();

vi.mock("../loaders/config", () => ({
  loadExecutorConfig: (...args: unknown[]) => loadExecutorConfigMock(...args),
}));

vi.mock("../utils/glob", () => ({
  expandFilePatterns: (...args: unknown[]) => expandFilePatternsMock(...args),
}));

vi.mock("../loaders/module-loader", () => ({
  loadModule: (...args: unknown[]) => loadModuleMock(...args),
}));

vi.mock("@autometa/runner", () => ({
  CucumberRunner: {
    builder: (...args: unknown[]) => cucumberRunnerBuilderMock(...args),
  },
}));

vi.mock("@autometa/gherkin", () => ({
  parseGherkin: (...args: unknown[]) => parseGherkinMock(...args),
}));

vi.mock("../runtime/cli-runtime", () => ({
  createCliRuntime: (...args: unknown[]) => createCliRuntimeMock(...args),
}));

describe("runFeatures", () => {
  const cwd = "/project";
  const cacheDir = join(cwd, ".autometa-cli", "cache");
  const defaultSummary: RuntimeSummary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    pending: 0,
    durationMs: 0,
    success: true,
    scenarios: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    createCliRuntimeMock.mockReturnValue({
      runtime: { label: "runtime" },
      execute: vi.fn().mockResolvedValue(defaultSummary),
    });
    loadModuleMock.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws when no feature files are discovered", async () => {
    const executorConfig: ExecutorConfig = {
      runner: "vitest",
      roots: {
        features: ["features"],
        steps: ["steps"],
      },
    };

    const loadedConfig: LoadedExecutorConfig = {
      filePath: join(cwd, "autometa.config.ts"),
      config: {} as never,
      resolved: {
        environment: "default",
        config: executorConfig,
      },
    };

    loadExecutorConfigMock.mockResolvedValue(loadedConfig);
    expandFilePatternsMock.mockResolvedValue([]);

    await expect(runFeatures({ cwd })).rejects.toThrowError(
      'No feature files found for patterns: "features"'
    );

    expect(loadExecutorConfigMock).toHaveBeenCalledWith(cwd, { cacheDir });
  });

  it("loads configuration, hydrates modules, and executes features", async () => {
    const executorConfig: ExecutorConfig = {
      runner: "vitest",
      roots: {
        features: ["features"],
        steps: ["steps"],
        parameterTypes: ["parameter-types"],
        support: ["support"],
      },
    };

    const loadedConfig: LoadedExecutorConfig = {
      filePath: join(cwd, "autometa.config.ts"),
      config: {} as never,
      resolved: {
        environment: "default",
        config: executorConfig,
      },
    };

    const featurePath = join(cwd, "features", "example.feature");
    const stepFile = join(cwd, "steps", "step.ts");
  const parameterTypesFile = join(cwd, "parameter-types", "bootstrap.ts");
    const supportFile = join(cwd, "support", "bootstrap.ts");

    loadExecutorConfigMock.mockResolvedValue(loadedConfig);

    expandFilePatternsMock.mockImplementation(async (patterns: readonly string[]) => {
      if (patterns.some((pattern) => pattern.endsWith(".feature"))) {
        return [featurePath];
      }
      if (patterns.some((pattern) => pattern.includes("steps"))) {
        return [stepFile, stepFile];
      }
      if (patterns.some((pattern) => pattern.includes("parameter-types"))) {
        return [parameterTypesFile];
      }
      if (patterns.some((pattern) => pattern.includes("support"))) {
        return [supportFile];
      }
      return [];
    });

    const fileContent = "Feature: Example";
    const readFileSpy = vi.spyOn(fs, "readFile").mockResolvedValue(fileContent);

    const feature = {
      id: "feature-id",
      keyword: "Feature",
      language: "en",
      name: "Example",
      tags: [],
      elements: [],
      comments: [],
    };

    parseGherkinMock.mockImplementation(() => ({ ...feature }));

    const registerPlanMock = vi.fn();
    const coordinateFeatureMock = vi
      .fn()
      .mockImplementation((options: { feature: unknown }) => ({
        register: registerPlanMock,
        feature: options.feature,
        adapter: {},
        plan: {},
        config: executorConfig,
      }));

    const stepsEnvironment = {
      coordinateFeature: coordinateFeatureMock,
    };

    cucumberRunnerBuilderMock.mockReturnValue({
      steps: () => stepsEnvironment,
    });

    const runtime = { label: "runtime" };
    const summary: RuntimeSummary = {
      total: 1,
      passed: 1,
      failed: 0,
      skipped: 0,
      pending: 0,
      durationMs: 25,
      success: true,
      scenarios: [],
    };

    createCliRuntimeMock.mockReturnValue({
      runtime,
      execute: vi.fn().mockResolvedValue(summary),
    });

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    const result = await runFeatures({ cwd });

    expect(result).toEqual(summary);
    expect(cucumberRunnerBuilderMock).toHaveBeenCalledTimes(1);

    expect(expandFilePatternsMock).toHaveBeenCalledTimes(4);
    expect(loadModuleMock).toHaveBeenCalledTimes(3);
    expect(loadModuleMock).toHaveBeenCalledWith(stepFile, {
      cwd,
      cacheDir,
    });
    expect(loadModuleMock).toHaveBeenCalledWith(parameterTypesFile, {
      cwd,
      cacheDir,
    });
    expect(loadModuleMock).toHaveBeenCalledWith(supportFile, {
      cwd,
      cacheDir,
    });

    expect(readFileSpy).toHaveBeenCalledWith(featurePath, "utf8");
    expect(parseGherkinMock).toHaveBeenCalledWith(fileContent);

    expect(coordinateFeatureMock).toHaveBeenCalledWith({
      feature: expect.objectContaining({ name: "Example", uri: "features/example.feature" }),
      config: executorConfig,
      runtime,
    });

    expect(registerPlanMock).toHaveBeenCalledWith(runtime);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Environment: default | Total: 1 | Passed: 1 | Failed: 0")
    );

    readFileSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
