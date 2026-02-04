import { CucumberRunner } from "@autometa/runner";

export interface BaseWorld {
  readonly state: Record<string, unknown>;
}

export const baseRunner = CucumberRunner.builder<BaseWorld>()
  .withWorld<BaseWorld>({ state: {} })
  .derivable();

