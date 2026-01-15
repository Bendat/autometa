import { CucumberRunner } from "@autometa/core/runner";

/**
 * Base world shared across all derived/group environments.
 *
 * Keep this minimal: common steps should depend on capabilities here.
 */
export interface BaseWorld {
  readonly state: Record<string, unknown>;
}

export const baseWorldDefaults: BaseWorld = {
  state: {},
};

/**
 * Base runner builder.
 *
 * - Derived/group runners should originate from this instance.
 * - Common runner configuration belongs here (assertions, parameter types, etc.).
 */
export const baseRunner = CucumberRunner.builder<BaseWorld>()
  .withWorld<BaseWorld>(baseWorldDefaults)
  .derivable();
