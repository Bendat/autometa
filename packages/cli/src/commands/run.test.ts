import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import type { ExecutorConfig } from "@autometa/config";
import type { LoadedExecutorConfig } from "../loaders/config";
import type { RuntimeSummary } from "../runtime/types";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { runFeatures } from "./run";

const loadExecutorConfigMock = vi.fn();
const expandFilePatternsMock = vi.fn();
const loadModuleMock = vi.fn();
const cucumberRunnerBuilderMock = vi.fn();
const parseGherkinMock = vi.fn();
const createCliRuntimeMock = vi.fn();
const registerSharedPluginMock = vi.fn();
const getSharedPluginsMock = vi.fn();
const createLoggingPluginMock = vi.fn();
const compileModulesMock = vi.fn();
const setStepsMock = vi.fn();
const orchestrateMock = vi.fn();

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
    setSteps: (...args: unknown[]) => setStepsMock(...args),
  },
  STEPS_ENVIRONMENT_META: Symbol.for("@autometa/runner:steps-environment-meta"),
}));

vi.mock("@autometa/gherkin", () => ({
  parseGherkin: (...args: unknown[]) => parseGherkinMock(...args),
}));

vi.mock("../runtime/cli-runtime", () => ({
  createCliRuntime: (...args: unknown[]) => createCliRuntimeMock(...args),
}));

vi.mock("@autometa/http", () => ({
  HTTP: {
    registerSharedPlugin: (...args: unknown[]) => registerSharedPluginMock(...args),
    getSharedPlugins: (...args: unknown[]) => getSharedPluginsMock(...args),
  },
  createLoggingPlugin: (...args: unknown[]) => createLoggingPluginMock(...args),
}));

vi.mock("../compiler/module-compiler", () => ({
  compileModules: (...args: unknown[]) => compileModulesMock(...args),
}));

vi.mock("../orchestrator", () => ({
  orchestrate: (...args: unknown[]) => orchestrateMock(...args),
  isNativeRunnerAvailable: () => true,
}));

describe("runFeatures", () => {
  let cwd: string;
  let cacheDir: string;
  let bundlePath: string;
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

  beforeEach(async () => {
    vi.resetAllMocks();
    cwd = await fs.mkdtemp(join(tmpdir(), "autometa-cli-test-"));
    cacheDir = join(cwd, ".autometa", "cache");
    process.env.AUTOMETA_CACHE_DIR = cacheDir;
    await fs.mkdir(cacheDir, { recursive: true });
    bundlePath = join(cacheDir, "__modules__.mjs");
    await fs.writeFile(bundlePath, "export const modules = [];\nexport default modules;\n", "utf8");
    createCliRuntimeMock.mockReturnValue({
      runtime: { label: "runtime" },
      execute: vi.fn().mockResolvedValue(defaultSummary),
    });
    loadModuleMock.mockResolvedValue({});
    getSharedPluginsMock.mockReturnValue([]);
    createLoggingPluginMock.mockImplementation(() => ({ name: "http-logging" }));
    compileModulesMock.mockResolvedValue({ bundlePath, format: "esm" });
    orchestrateMock.mockResolvedValue({ success: true, exitCode: 0, runner: "default" });
  });

  afterEach(async () => {
    vi.clearAllMocks();
    delete process.env.AUTOMETA_CACHE_DIR;
    if (cwd) {
      await fs.rm(cwd, { recursive: true, force: true });
    }
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

    await expect(runFeatures({ cwd, mode: "standalone" })).rejects.toThrowError(
      'No feature files found for patterns: "features"'
    );

    expect(loadExecutorConfigMock).toHaveBeenCalledWith(cwd, { cacheDir });
    expect(registerSharedPluginMock).not.toHaveBeenCalled();
    expect(compileModulesMock).not.toHaveBeenCalled();
  });

  it("passes module and group filters to the config loader", async () => {
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

    await expect(
      runFeatures({
        cwd,
        mode: "standalone",
        groups: ["backoffice"],
        modules: ["orders:cancellations"],
      })
    ).rejects.toThrowError('No feature files found for patterns: "features"');

    expect(loadExecutorConfigMock).toHaveBeenCalledWith(cwd, {
      cacheDir,
      groups: ["backoffice"],
      modules: ["orders:cancellations"],
    });
  });

  it("passes environment selection to the config loader", async () => {
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
        environment: "hoisted",
        config: executorConfig,
      },
    };

    loadExecutorConfigMock.mockResolvedValue(loadedConfig);
    expandFilePatternsMock.mockResolvedValue([]);

    await expect(
      runFeatures({
        cwd,
        mode: "standalone",
        environment: "hoisted",
      })
    ).rejects.toThrowError('No feature files found for patterns: "features"');

    expect(loadExecutorConfigMock).toHaveBeenCalledWith(cwd, {
      cacheDir,
      environment: "hoisted",
    });
  });

  it("warns when explicit patterns are combined with module selection", async () => {
    const executorConfig: ExecutorConfig = {
      runner: "vitest",
      roots: {
        features: ["src/features"],
        steps: ["steps"],
      },
      modules: {
        groups: {
          "brew-buddy": {
            root: "src/groups/brew-buddy",
            modules: ["menu"],
          },
        },
      },
    } as ExecutorConfig;

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

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(
      runFeatures({
        cwd,
        mode: "standalone",
        patterns: ["src/features/example.feature"],
        groups: ["brew-buddy"],
      })
    ).rejects.toThrowError();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("patterns");
    expect(warnSpy.mock.calls[0]?.[0]).toContain("-g/-m");

    warnSpy.mockRestore();
  });

  it("forwards runnerArgs to the native orchestrator", async () => {
    const executorConfig: ExecutorConfig = {
      runner: "jest",
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
    orchestrateMock.mockResolvedValue({ success: true, exitCode: 0, runner: "jest" });

    const result = await runFeatures({
      cwd,
      patterns: ["features/example.feature"],
      runnerArgs: ["-t", "my test"],
    });

    expect(result.success).toBe(true);
    expect(orchestrateMock).toHaveBeenCalledTimes(1);
    expect(orchestrateMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        cwd,
        patterns: ["features/example.feature"],
        runnerArgs: ["-t", "my test"],
      })
    );
  });

  it("configures reporter buffering from executor config", async () => {
    const executorConfig: ExecutorConfig = {
      runner: "vitest",
      roots: {
        features: ["features"],
        steps: ["steps"],
      },
      reporting: {
        hierarchical: {
          bufferOutput: false,
        },
      },
    } as ExecutorConfig;

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

    await expect(runFeatures({ cwd, mode: "standalone" })).rejects.toThrowError(
      'No feature files found for patterns: "features"'
    );

    expect(createCliRuntimeMock).toHaveBeenCalledTimes(1);
    expect(createCliRuntimeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        reporter: {
          hierarchical: {
            bufferOutput: false,
          },
        },
      })
    );
  });

  it("registers HTTP logging when enabled", async () => {
    const executorConfig: ExecutorConfig = {
      runner: "vitest",
      roots: {
        features: ["features"],
        steps: ["steps"],
      },
      logging: {
        http: true,
      },
    };

    const featurePath = join(cwd, "features", "example.feature");
    const stepFile = join(cwd, "steps", "step.ts");

    const loadedConfig: LoadedExecutorConfig = {
      filePath: join(cwd, "autometa.config.ts"),
      config: {} as never,
      resolved: {
        environment: "default",
        config: executorConfig,
      },
    };

    loadExecutorConfigMock.mockResolvedValue(loadedConfig);

    expandFilePatternsMock.mockImplementation(async (patterns: readonly string[]) => {
      if (patterns.some((pattern) => pattern.endsWith(".feature"))) {
        return [featurePath];
      }
      if (patterns.some((pattern) => pattern.includes("steps"))) {
        return [stepFile];
      }
      return [];
    });

    parseGherkinMock.mockReturnValue({
      id: "feature",
      keyword: "Feature",
      language: "en",
      name: "Example",
      tags: [],
      elements: [],
      comments: [],
    });

    const rootScope = {
      id: "root",
      kind: "root",
      name: "root",
      mode: "default",
      tags: [],
      steps: [],
      hooks: [],
      children: [],
      pending: false,
    };

    const basePlan = {
      root: rootScope,
      stepsById: new Map<string, unknown>(),
      hooksById: new Map<string, unknown>(),
      scopesById: new Map([[rootScope.id, rootScope]]),
    };

    const stepsEnvironment = {
      coordinateFeature: vi.fn().mockReturnValue({
        register: vi.fn(),
        config: executorConfig,
      }),
      Given: vi.fn(),
      When: vi.fn(),
      Then: vi.fn(),
      getPlan: vi.fn().mockReturnValue(basePlan),
    };

    cucumberRunnerBuilderMock.mockReturnValue({
      steps: () => stepsEnvironment,
    });

    createCliRuntimeMock.mockReturnValue({
      runtime: {},
      execute: vi.fn().mockResolvedValue(defaultSummary),
    });

    const readFileSpy = vi.spyOn(fs, "readFile").mockResolvedValue("Feature: Example");

    await runFeatures({ cwd, mode: "standalone" });

    expect(createLoggingPluginMock).toHaveBeenCalledTimes(1);
    expect(registerSharedPluginMock).toHaveBeenCalledTimes(1);
    expect(compileModulesMock).toHaveBeenCalledTimes(1);
    expect(compileModulesMock).toHaveBeenCalledWith([stepFile], expect.objectContaining({
      cwd,
      cacheDir,
    }));
    expect(setStepsMock).toHaveBeenCalledWith(stepsEnvironment);
    expect(readFileSpy).toHaveBeenCalledWith(featurePath, "utf8");

    readFileSpy.mockRestore();
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

    const rootScope = {
      id: "root",
      kind: "root",
      name: "root",
      mode: "default",
      tags: [],
      steps: [],
      hooks: [],
      children: [],
      pending: false,
    };

    const basePlan = {
      root: rootScope,
      stepsById: new Map<string, unknown>(),
      hooksById: new Map<string, unknown>(),
      scopesById: new Map([[rootScope.id, rootScope]]),
    };

    const stepsEnvironment = {
      coordinateFeature: coordinateFeatureMock,
      Given: vi.fn(),
      When: vi.fn(),
      Then: vi.fn(),
      getPlan: vi.fn().mockReturnValue(basePlan),
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

    const result = await runFeatures({ cwd, mode: "standalone" });

    expect(result).toEqual(summary);
    expect(cucumberRunnerBuilderMock).toHaveBeenCalledTimes(1);

    expect(expandFilePatternsMock).toHaveBeenCalledTimes(4);
    expect(registerSharedPluginMock).not.toHaveBeenCalled();
    expect(compileModulesMock).toHaveBeenCalledTimes(1);
    expect(compileModulesMock).toHaveBeenCalledWith(
      [parameterTypesFile, supportFile, stepFile],
      expect.objectContaining({ cwd, cacheDir })
    );
    expect(setStepsMock).toHaveBeenCalledWith(stepsEnvironment);

    expect(readFileSpy).toHaveBeenCalledWith(featurePath, "utf8");
    expect(parseGherkinMock).toHaveBeenCalledWith(fileContent);

    expect(coordinateFeatureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: expect.objectContaining({ name: "Example", uri: "features/example.feature" }),
        config: executorConfig,
        runtime,
      })
    );

    expect(registerPlanMock).toHaveBeenCalledWith(runtime);

    const loggedSummary = consoleLogSpy.mock.calls[0]?.[0] as string | undefined;
    expect(typeof loggedSummary).toBe("string");
    // eslint-disable-next-line no-control-regex
    const normalizedSummary = loggedSummary.replace(/\x1B\[[0-9;]*m/g, "");
    expect(normalizedSummary).toContain("Environment: default");
    expect(normalizedSummary).toContain("Total: 1");
    expect(normalizedSummary).toContain("Passed: 1");

    readFileSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});
