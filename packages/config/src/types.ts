import { z } from "zod";

import { EnvironmentSelector } from "./environment-selector";
import {
  ExecutorConfigSchema,
  PartialExecutorConfigSchema,
  PartialRootSchema,
  ModulesConfigSchema,
} from "./schema";
import type {
  BuilderConfig,
  BuilderHooks,
  BuildHook,
  BuildHookContext,
  ModuleFormat,
  SourceMapSetting,
} from "./builder-types";

export type ExecutorConfig = z.infer<typeof ExecutorConfigSchema>;
export type PartialExecutorConfig = z.infer<typeof PartialExecutorConfigSchema>;
export type PartialRootsConfig = z.infer<typeof PartialRootSchema>;
export type ModulesConfig = z.infer<typeof ModulesConfigSchema>;
export type TimeoutSetting = ExecutorConfig["test"] extends infer Test
  ? Test extends { timeout?: infer Timeout }
    ? NonNullable<Timeout>
    : never
  : never;
export type TestConfig = NonNullable<ExecutorConfig["test"]>;
export type ShimConfig = NonNullable<ExecutorConfig["shim"]>;
export type RootsConfig = ExecutorConfig["roots"];
export type LoggingConfig = ExecutorConfig["logging"];
export type ReporterConfig = ExecutorConfig["reporting"];

export interface ConfigDefinitionInput {
  default: ExecutorConfig;
  environments?: Record<string, PartialExecutorConfig | undefined>;
  environment?: (selector: EnvironmentSelector) => void;
}

export interface ConfigDefinition {
  default: ExecutorConfig;
  environments: Record<string, PartialExecutorConfig>;
  selector: EnvironmentSelector;
}

export interface ResolveOptions {
  environment?: string;
  /**
   * Module selectors. Accepted forms:
   * - "<group>/<module>" or "<group>:<module>" (exact)
   * - "<module>" (suffix match, must be unambiguous; can be combined with group filters)
   */
  modules?: readonly string[];
  /**
   * Optional module-group filters.
   * Groups are configured in config.modules.groups via their keys (friendly names).
   */
  groups?: readonly string[];
}

export interface ResolvedConfig {
  environment: string;
  config: ExecutorConfig;
}

export type {
  BuilderConfig,
  BuilderHooks,
  BuildHook,
  BuildHookContext,
  ModuleFormat,
  SourceMapSetting,
};
