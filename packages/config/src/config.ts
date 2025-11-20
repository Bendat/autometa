import { AutomationError } from "@autometa/errors";

import { EnvironmentSelector } from "./environment-selector";
import {
  ExecutorConfigSchema,
  PartialExecutorConfigSchema,
} from "./schema";
import {
  ConfigDefinition,
  ConfigDefinitionInput,
  BuilderConfig,
  ExecutorConfig,
  PartialExecutorConfig,
  PartialRootsConfig,
  ResolveOptions,
  ResolvedConfig,
  RootsConfig,
  ShimConfig,
  TestConfig,
  LoggingConfig,
  TimeoutSetting,
} from "./types";

export class Config {
  private readonly definition: ConfigDefinition;

  constructor(definition: ConfigDefinition) {
    this.definition = definition;
  }

  resolve(options: ResolveOptions = {}): ResolvedConfig {
    const environment = this.resolveEnvironment(options);
    const override = this.definition.environments[environment] ?? {};
    const merged = mergeExecutorConfig(this.definition.default, override);
    const validated = ExecutorConfigSchema.parse(merged);
    return {
      environment,
      config: deepFreeze(validated),
    };
  }

  current(options?: ResolveOptions): ExecutorConfig {
    return this.resolve(options).config;
  }

  get environment(): string {
    return this.resolve().environment;
  }

  forEnvironment(environment: string): ExecutorConfig {
    return this.resolve({ environment }).config;
  }

  private resolveEnvironment(options: ResolveOptions): string {
    if (options.environment) {
      return this.assertEnvironment(options.environment);
    }
    const detected = this.definition.selector.resolve();
    return this.assertEnvironment(detected);
  }

  private assertEnvironment(environment: string): string {
    if (environment === "default") {
      return environment;
    }
    if (!this.definition.environments[environment]) {
      const available = [
        "default",
        ...Object.keys(this.definition.environments).filter(
          (name) => name !== "default"
        ),
      ];
      const options = available.length
        ? available.join(", ")
        : "(define environments to extend the default profile)";
      throw new AutomationError(
        `Environment "${environment}" is not defined. Available environments: ${options}`
      );
    }
    return environment;
  }
}

export const defineConfig = (input: ConfigDefinitionInput): Config => {
  const selector = new EnvironmentSelector();
  selector.defaultTo("default");
  if (input.environment) {
    input.environment(selector);
  }

  const defaultConfig = deepFreeze(ExecutorConfigSchema.parse(input.default));
  const environments: Record<string, PartialExecutorConfig> = {};

  for (const [name, rawOverride] of Object.entries(input.environments ?? {})) {
    if (!name.trim()) {
      throw new AutomationError("Environment name must be a non-empty string");
    }
    const override = rawOverride
      ? PartialExecutorConfigSchema.parse(rawOverride)
      : {};
    environments[name] = deepFreeze(override);
  }

  return new Config({
    default: defaultConfig,
    environments,
    selector,
  });
};

const mergeExecutorConfig = (
  base: ExecutorConfig,
  override: PartialExecutorConfig
): ExecutorConfig => {
  const result = cloneConfig(base);

  if (override.runner) {
    result.runner = override.runner;
  }

  if (override.test !== undefined) {
    result.test = mergeTest(result.test, override.test);
  }

  if (override.roots !== undefined) {
    result.roots = mergeRoots(result.roots, override.roots);
  }

  if (override.shim !== undefined) {
    result.shim = mergeShim(result.shim, override.shim);
  }

  if (override.events !== undefined) {
    result.events = cloneArray(override.events);
  }

  if (override.builder !== undefined) {
    result.builder = mergeBuilder(result.builder, override.builder);
  }

  if (override.logging !== undefined) {
    result.logging = mergeLogging(result.logging, override.logging);
  }

  return result;
};

type LoggingConfigValue = NonNullable<LoggingConfig>;

const mergeTest = (
  base: TestConfig | undefined,
  override: PartialExecutorConfig["test"]
): TestConfig | undefined => {
  if (override === undefined) {
    return base ? cloneTest(base) : undefined;
  }
  const result = base ? cloneTest(base) : {};

  if (override.timeout !== undefined) {
    result.timeout = cloneTimeout(override.timeout);
  }

  if (override.tagFilter !== undefined) {
    result.tagFilter = override.tagFilter;
  }

  if (override.groupLogging !== undefined) {
    result.groupLogging = override.groupLogging;
  }

  return Object.keys(result).length === 0 ? undefined : result;
};

const mergeShim = (
  base: ShimConfig | undefined,
  override: PartialExecutorConfig["shim"]
): ShimConfig | undefined => {
  if (override === undefined) {
    return base ? cloneShim(base) : undefined;
  }
  const result = base ? cloneShim(base) : {};

  if (override.errorCause !== undefined) {
    result.errorCause = override.errorCause;
  }

  return Object.keys(result).length === 0 ? undefined : result;
};

const mergeLogging = (
  base: LoggingConfig | undefined,
  override: PartialExecutorConfig["logging"]
): LoggingConfig | undefined => {
  if (override === undefined) {
    return base ? cloneLogging(base) : undefined;
  }

  const result: LoggingConfigValue = base ? cloneLogging(base) : {};

  if (override.http !== undefined) {
    result.http = override.http;
  }

  return Object.keys(result).length === 0 ? undefined : result;
};

const mergeRoots = (
  base: RootsConfig,
  override: PartialRootsConfig | undefined
): RootsConfig => {
  const result = cloneRoots(base);

  if (!override) {
    return result;
  }

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) {
      continue;
    }
  result[key] = cloneArray(value);
  }

  if (!result.features) {
    throw new AutomationError(
      'Environment overrides removed required root "features"'
    );
  }

  if (!result.steps) {
    throw new AutomationError(
      'Environment overrides removed required root "steps"'
    );
  }

  return result;
};

const mergeBuilder = (
  base: BuilderConfig | undefined,
  override: BuilderConfig | undefined
): BuilderConfig | undefined => {
  if (override === undefined) {
    return base ? cloneBuilder(base) : undefined;
  }

  const result = base ? cloneBuilder(base) : {};

  if (override.format !== undefined) {
    result.format = override.format;
  }

  if (override.target !== undefined) {
    result.target = Array.isArray(override.target)
      ? [...override.target]
      : override.target;
  }

  if (override.sourcemap !== undefined) {
    result.sourcemap = override.sourcemap;
  }

  if (override.tsconfig !== undefined) {
    result.tsconfig = override.tsconfig;
  }

  if (override.external !== undefined) {
    result.external = cloneArray(override.external);
  }

  if (override.outDir !== undefined) {
    result.outDir = override.outDir;
  }

  if (override.hooks !== undefined) {
    const clonedHooks = cloneBuilderHooks(override.hooks);
    if (clonedHooks) {
      result.hooks = clonedHooks;
    } else {
      delete result.hooks;
    }
  }

  return Object.keys(result).length === 0 ? undefined : result;
};

const cloneConfig = (config: ExecutorConfig): ExecutorConfig => ({
  runner: config.runner,
  roots: cloneRoots(config.roots),
  test: config.test ? cloneTest(config.test) : undefined,
  shim: config.shim ? cloneShim(config.shim) : undefined,
  events: cloneOptionalArray(config.events),
  builder: config.builder ? cloneBuilder(config.builder) : undefined,
  logging: config.logging ? cloneLogging(config.logging) : undefined,
});

const cloneRoots = (roots: RootsConfig): RootsConfig => {
  const cloned: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(roots)) {
    if (value) {
  cloned[key] = cloneArray(value);
    }
  }
  return cloned as RootsConfig;
};

const cloneTest = (test: TestConfig): TestConfig => {
  const clone: TestConfig = {};
  if (test.timeout !== undefined) {
    clone.timeout = cloneTimeout(test.timeout);
  }
  if (test.tagFilter !== undefined) {
    clone.tagFilter = test.tagFilter;
  }
  if (test.groupLogging !== undefined) {
    clone.groupLogging = test.groupLogging;
  }
  return clone;
};

const cloneShim = (shim: ShimConfig): ShimConfig => {
  const clone: ShimConfig = {};
  if (shim.errorCause !== undefined) {
    clone.errorCause = shim.errorCause;
  }
  return clone;
};

const cloneLogging = (
  logging: LoggingConfigValue
): LoggingConfigValue => {
  const clone: LoggingConfigValue = {};
  if (logging.http !== undefined) {
    clone.http = logging.http;
  }
  return clone;
};

const cloneBuilder = (config: BuilderConfig): BuilderConfig => {
  const clone: BuilderConfig = {};

  if (config.format !== undefined) {
    clone.format = config.format;
  }

  if (config.target !== undefined) {
    clone.target = Array.isArray(config.target)
      ? [...config.target]
      : config.target;
  }

  if (config.sourcemap !== undefined) {
    clone.sourcemap = config.sourcemap;
  }

  if (config.tsconfig !== undefined) {
    clone.tsconfig = config.tsconfig;
  }

  if (config.external !== undefined) {
    clone.external = cloneArray(config.external);
  }

  if (config.outDir !== undefined) {
    clone.outDir = config.outDir;
  }

  if (config.hooks) {
    const clonedHooks = cloneBuilderHooks(config.hooks);
    if (clonedHooks) {
      clone.hooks = clonedHooks;
    }
  }

  return clone;
};

const cloneBuilderHooks = (
  hooks: NonNullable<BuilderConfig["hooks"]>
): NonNullable<BuilderConfig["hooks"]> | undefined => {
  const clone: NonNullable<BuilderConfig["hooks"]> = {};

  if (hooks.before && hooks.before.length > 0) {
    clone.before = [...hooks.before];
  }

  if (hooks.after && hooks.after.length > 0) {
    clone.after = [...hooks.after];
  }

  return Object.keys(clone).length === 0 ? undefined : clone;
};

const cloneTimeout = (
  timeout: TimeoutSetting | undefined
): TimeoutSetting | undefined => {
  if (timeout === undefined) {
    return undefined;
  }
  if (typeof timeout === "number") {
    return timeout;
  }
  if (Array.isArray(timeout)) {
    const [value, unit] = timeout;
    return [value, unit] as TimeoutSetting;
  }
  return { ...timeout } as TimeoutSetting;
};

const cloneArray = (value: readonly string[]): string[] => [...value];

const cloneOptionalArray = (
  value: readonly string[] | undefined
): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return [...value];
};

const deepFreeze = <T>(value: T): T => {
  if (value === null || typeof value !== "object") {
    return value;
  }

  const propertyNames = Object.getOwnPropertyNames(value);
  for (const name of propertyNames) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const property = (value as any)[name];
    if (property && typeof property === "object") {
      deepFreeze(property);
    }
  }

  return Object.freeze(value);
};
