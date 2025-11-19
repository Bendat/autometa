import { z } from "zod";

import { EnvironmentSelector } from "./environment-selector";
import {
  ExecutorConfigSchema,
  PartialExecutorConfigSchema,
  PartialRootSchema,
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
export type TimeoutSetting = ExecutorConfig["test"] extends infer Test
  ? Test extends { timeout?: infer Timeout }
    ? NonNullable<Timeout>
    : never
  : never;
export type TestConfig = NonNullable<ExecutorConfig["test"]>;
export type ShimConfig = NonNullable<ExecutorConfig["shim"]>;
export type RootsConfig = ExecutorConfig["roots"];

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
