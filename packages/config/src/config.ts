import { AutomationError } from "@autometa/errors";

import { posix as pathPosix } from "node:path";

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
  ModulesConfig,
  ResolveOptions,
  ResolvedConfig,
  RootsConfig,
  ShimConfig,
  TestConfig,
  LoggingConfig,
  ReporterConfig,
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
    const expanded = expandModules(validated, options.modules, options.groups);
    return {
      environment,
      config: deepFreeze(expanded),
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

  if (override.modules !== undefined) {
    result.modules = cloneModules(override.modules);
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

  if (override.reporting !== undefined) {
    result.reporting = mergeReporting(result.reporting, override.reporting);
  }

  return result;
};
const expandModules = (
  config: ExecutorConfig,
  moduleFilters: readonly string[] | undefined,
  groupFilters: readonly string[] | undefined
): ExecutorConfig => {
  const modulesConfig = config.modules;
  if (!modulesConfig) {
    return config;
  }

  const relativeRoots = modulesConfig.relativeRoots;
  const hasRelativeRoots = !!relativeRoots && Object.keys(relativeRoots).length > 0;
  if (!hasRelativeRoots) {
    const hasFilters =
      (moduleFilters?.some((m) => m.trim().length > 0) ?? false) ||
      (groupFilters?.some((g) => g.trim().length > 0) ?? false);

    // Allow "modules" to act as a module registry even when everything is hoisted,
    // but fail fast if the user provided filters expecting module expansion.
    if (hasFilters) {
      throw new AutomationError(
        'Module filters were provided, but "modules.relativeRoots" is not configured. ' +
          'Configure at least one relative root (e.g. { steps: ["steps/**/*.ts"] }) or remove -m/-g.'
      );
    }

    return config;
  }

  const moduleEntries = collectModuleEntries(modulesConfig);
  if (moduleEntries.length === 0) {
    throw new AutomationError(
      'When "modules" is provided, at least one module must be declared via "groups" or "explicit".'
    );
  }

  const selectedModules = selectModules(moduleEntries, moduleFilters, groupFilters);
  const expandedByKey: Record<string, string[]> = {};

  for (const [key, entries] of Object.entries(relativeRoots)) {
    if (!entries || entries.length === 0) {
      continue;
    }

    const expanded: string[] = [];
    for (const moduleDir of selectedModules) {
      for (const entry of entries) {
        const joined = joinModuleEntry(moduleDir, entry);
        if (joined) {
          expanded.push(joined);
        }
      }
    }

    if (expanded.length > 0) {
      expandedByKey[key] = expanded;
    }
  }

  if (Object.keys(expandedByKey).length === 0) {
    return config;
  }

  const roots = cloneRoots(config.roots);
  for (const [key, expanded] of Object.entries(expandedByKey)) {
    const existing = roots[key] ?? [];
    roots[key] = [...expanded, ...existing];
  }

  return {
    ...config,
    roots,
  };
};

interface ModuleEntry {
  readonly id: string;
  readonly dir: string;
}

type ModuleDeclaration = NonNullable<NonNullable<ModulesConfig["groups"]>[string]["modules"]>[number];

const flattenModuleDeclarations = (
  declarations: readonly ModuleDeclaration[],
  prefix = ""
): string[] => {
  const flattened: string[] = [];

  const walk = (items: readonly ModuleDeclaration[], currentPrefix: string): void => {
    for (const item of items) {
      if (typeof item === "string") {
        const name = normalizeSlashes(item.trim()).replace(/^\/+|\/+$/gu, "");
        if (!name) {
          continue;
        }
        flattened.push(normalizeSlashes(pathPosix.join(currentPrefix, name)));
        continue;
      }

      const name = normalizeSlashes(item.name.trim()).replace(/^\/+|\/+$/gu, "");
      if (!name) {
        continue;
      }

      const nextPrefix = normalizeSlashes(pathPosix.join(currentPrefix, name));
      // Always include the parent module path itself.
      flattened.push(nextPrefix);

      if (item.submodules && item.submodules.length > 0) {
        walk(item.submodules as readonly ModuleDeclaration[], nextPrefix);
      }
    }
  };

  const cleanedPrefix = normalizeSlashes(prefix.trim()).replace(/\/+$/u, "");
  walk(declarations, cleanedPrefix);

  return Array.from(new Set(flattened));
};

const collectModuleEntries = (modulesConfig: ModulesConfig): ModuleEntry[] => {
  const entries: ModuleEntry[] = [];
  const seen = new Set<string>();

  for (const [groupId, group] of Object.entries(modulesConfig.groups ?? {})) {
    const normalizedGroupId = groupId.trim();
    if (!normalizedGroupId) {
      continue;
    }

    const root = normalizeSlashes(group.root.trim()).replace(/\/+$/u, "");
    if (!root) {
      continue;
    }

    const modulePaths = flattenModuleDeclarations(group.modules);

    for (const modulePath of modulePaths) {
      const cleaned = normalizeSlashes(modulePath.trim()).replace(/^\/+|\/+$/gu, "");
      if (!cleaned) {
        continue;
      }

      const dir = normalizeSlashes(pathPosix.join(root, cleaned));
      const id = `${normalizedGroupId}/${cleaned}`;
      const key = `${id}::${dir}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      entries.push({ id, dir });
    }
  }

  for (const explicit of modulesConfig.explicit ?? []) {
    const normalized = normalizeSlashes(explicit.trim());
    if (!normalized) {
      continue;
    }
    const id = normalized;
    const key = `${id}::${normalized}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    entries.push({ id, dir: normalized });
  }

  return entries;
};

const selectModules = (
  moduleEntries: readonly ModuleEntry[],
  moduleFilters: readonly string[] | undefined,
  groupFilters: readonly string[] | undefined
): string[] => {
  const options = moduleEntries.map((m) => ({
    id: normalizeSlashes(m.id),
    dir: normalizeSlashes(m.dir),
    group: normalizeSlashes(m.id.split("/")[0] ?? ""),
  }));

  const groupFilterSet = new Set(
    (groupFilters ?? []).map((g) => normalizeSlashes(g.trim())).filter(Boolean)
  );

  const inGroupScope = (candidate: (typeof options)[number]): boolean => {
    if (groupFilterSet.size === 0) {
      return true;
    }
    return groupFilterSet.has(candidate.group);
  };

  const scopedOptions = options.filter(inGroupScope);
  if (groupFilterSet.size > 0 && scopedOptions.length === 0) {
    throw new AutomationError(
      `No modules found for group filter(s): ${Array.from(groupFilterSet).join(", ")}. ` +
        `Available groups: ${Array.from(new Set(options.map((o) => o.group))).filter(Boolean).join(", ")}`
    );
  }

  if (!moduleFilters || moduleFilters.length === 0) {
    return scopedOptions.map((o) => o.dir);
  }

  const scopedGroups = new Set(scopedOptions.map((o) => o.group).filter(Boolean));

  const selected = new Set<string>();

  for (const rawFilter of moduleFilters) {
    const filter = normalizeSlashes(rawFilter.trim());
    if (!filter) {
      continue;
    }

    const parsed = parseModuleSelector(filter, scopedGroups);

    // Exact selector: group/module[/...] or group:module[:...]
    if (parsed) {
      const wantedId = `${parsed.group}/${parsed.modulePath}`;
      const exact = scopedOptions.filter((o) => o.id === wantedId);
      if (exact.length === 0) {
        throw new AutomationError(
          `Module "${rawFilter}" not found. Available modules: ${scopedOptions.map((o) => o.id).join(", ")}`
        );
      }
      const match = exact[0];
      if (match) {
        selected.add(match.dir);
      }
      continue;
    }

    // Path/suffix selector: (must be unambiguous)
    // - "orders" matches "<group>/orders"
    // - "orders/cancellations" matches "<group>/orders/cancellations"
    // - "orders:cancellations" is treated as a path selector (":" => "/")
    const pathSelector = filter.includes(":") ? filter.split(":").join("/") : filter;
    const suffixMatches = scopedOptions.filter((o) => o.id.endsWith(`/${pathSelector}`));
    if (suffixMatches.length === 0) {
      throw new AutomationError(
        `Module "${rawFilter}" not found. Available modules: ${scopedOptions.map((o) => o.id).join(", ")}`
      );
    }
    if (suffixMatches.length > 1) {
      throw new AutomationError(
        `Module filter "${rawFilter}" is ambiguous. Candidates: ${suffixMatches.map((m) => m.id).join(", ")}. ` +
          `Use "<group>/<module>" or "<group>:<module>" to disambiguate.`
      );
    }
    const match = suffixMatches[0];
    if (match) {
      selected.add(match.dir);
    }
  }

  return scopedOptions.map((o) => o.dir).filter((dir) => selected.has(dir));
};

const parseModuleSelector = (
  selector: string,
  knownGroups: ReadonlySet<string>
): { readonly group: string; readonly modulePath: string } | undefined => {
  if (!selector) {
    return undefined;
  }

  // Prefer ':' for deep exact selectors: group:module[:submodule...]
  if (selector.includes(":")) {
    const parts = selector.split(":").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const group = parts[0];
      if (!group) {
        return undefined;
      }
      if (knownGroups.has(group)) {
        const modulePath = normalizeSlashes(parts.slice(1).join("/")).replace(/^\/+|\/+$/gu, "");
        if (modulePath) {
          return { group, modulePath };
        }
      }
    }
  }

  // Also allow '/' for deep exact selectors: group/module[/submodule...]
  if (selector.includes("/")) {
    const parts = selector.split("/").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const group = parts[0];
      if (!group) {
        return undefined;
      }
      if (knownGroups.has(group)) {
        const modulePath = normalizeSlashes(parts.slice(1).join("/")).replace(/^\/+|\/+$/gu, "");
        if (modulePath) {
          return { group, modulePath };
        }
      }
    }
  }

  return undefined;
};

const joinModuleEntry = (moduleDir: string, entry: string): string | undefined => {
  const moduleTrimmed = normalizeSlashes(moduleDir.trim()).replace(/\/+$/u, "");
  if (!moduleTrimmed) {
    return undefined;
  }

  const entryTrimmed = normalizeSlashes(entry.trim());
  if (!entryTrimmed) {
    return undefined;
  }

  const negated = entryTrimmed.startsWith("!");
  const raw = negated ? entryTrimmed.slice(1).trim() : entryTrimmed;

  if (!raw || raw === ".") {
    return negated ? `!${moduleTrimmed}` : moduleTrimmed;
  }

  if (raw.startsWith("/") || /^[A-Za-z]:\//u.test(raw)) {
    return negated ? `!${raw}` : raw;
  }

  const joined = normalizeSlashes(pathPosix.join(moduleTrimmed, raw));
  return negated ? `!${joined}` : joined;
};

const normalizeSlashes = (value: string): string => value.replace(/\\/gu, "/");

type LoggingConfigValue = NonNullable<LoggingConfig>;
type ReportingConfigValue = NonNullable<ReporterConfig>;

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

const mergeReporting = (
  base: ReporterConfig | undefined,
  override: PartialExecutorConfig["reporting"]
): ReporterConfig | undefined => {
  if (override === undefined) {
    return base ? cloneReporting(base) : undefined;
  }

  const result: ReportingConfigValue = base ? cloneReporting(base) : {};

  if (override.hierarchical !== undefined) {
    const hierarchicalOverride = override.hierarchical;
    if (hierarchicalOverride) {
      const hierarchical = result.hierarchical ? { ...result.hierarchical } : {};
      if (hierarchicalOverride.bufferOutput !== undefined) {
        hierarchical.bufferOutput = hierarchicalOverride.bufferOutput;
      }
      if (Object.keys(hierarchical).length > 0) {
        result.hierarchical = hierarchical;
      } else {
        delete result.hierarchical;
      }
    } else {
      delete result.hierarchical;
    }
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
  modules: config.modules ? cloneModules(config.modules) : undefined,
  test: config.test ? cloneTest(config.test) : undefined,
  shim: config.shim ? cloneShim(config.shim) : undefined,
  events: cloneOptionalArray(config.events),
  builder: config.builder ? cloneBuilder(config.builder) : undefined,
  logging: config.logging ? cloneLogging(config.logging) : undefined,
  reporting: config.reporting ? cloneReporting(config.reporting) : undefined,
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

const cloneRootRecord = (
  roots: Record<string, readonly string[] | undefined>
): Record<string, string[]> => {
  const cloned: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(roots)) {
    if (!value) {
      continue;
    }
    cloned[key] = cloneArray(value);
  }
  return cloned;
};

const cloneGroups = (
  groups: NonNullable<ModulesConfig["groups"]>
): NonNullable<ModulesConfig["groups"]> => {
  const cloneModuleDeclaration = (value: ModuleDeclaration): ModuleDeclaration => {
    if (typeof value === "string") {
      return value;
    }
    return {
      name: value.name,
      submodules: value.submodules
        ? (value.submodules.map((child) => cloneModuleDeclaration(child as ModuleDeclaration)) as ModuleDeclaration[])
        : undefined,
    };
  };

  const cloned: Record<
    string,
    { root: string; modules: [ModuleDeclaration, ...ModuleDeclaration[]] }
  > = {};
  for (const [key, group] of Object.entries(groups)) {
    cloned[key] = {
      root: group.root,
      modules: group.modules.map((m) => cloneModuleDeclaration(m as ModuleDeclaration)) as [
        ModuleDeclaration,
        ...ModuleDeclaration[]
      ],
    };
  }
  return cloned as NonNullable<ModulesConfig["groups"]>;
};

const cloneModules = (modules: ModulesConfig): ModulesConfig => {
  const clone: ModulesConfig = {};

  if (modules.stepScoping) {
    clone.stepScoping = modules.stepScoping;
  }

  if (modules.hoistedFeatures) {
    clone.hoistedFeatures = {
      ...(modules.hoistedFeatures.scope ? { scope: modules.hoistedFeatures.scope } : {}),
      ...(modules.hoistedFeatures.strict !== undefined ? { strict: modules.hoistedFeatures.strict } : {}),
    };
  }

  if (modules.relativeRoots) {
    clone.relativeRoots = cloneRootRecord(modules.relativeRoots);
  }

  if (modules.groups) {
    clone.groups = cloneGroups(modules.groups);
  }

  if (modules.explicit) {
    clone.explicit = cloneArray(modules.explicit);
  }

  return clone;
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

const cloneReporting = (
  reporting: ReportingConfigValue
): ReportingConfigValue => {
  const clone: ReportingConfigValue = {};
  if (reporting.hierarchical) {
    clone.hierarchical = { ...reporting.hierarchical };
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
