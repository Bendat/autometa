import { CucumberRunner } from "@autometa/runner";

export interface ModuleTestWorld {
  readonly state: Record<string, unknown>;
}

export const worldDefaults: ModuleTestWorld = {
  state: {},
};

const runner = CucumberRunner.builder().withWorld<ModuleTestWorld>(worldDefaults);

/**
 * Exported surface for Autometa to discover.
 *
 * Convention: keep this export name stable.
 */
export const stepsEnvironment = runner.steps();

export const { Given, When, Then, And, But, ensure } = stepsEnvironment;