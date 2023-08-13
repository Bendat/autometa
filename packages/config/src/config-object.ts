import { AutomationError, raise } from "@autometa/errors";
import { EnvironmentReader } from "./environment-reader";
import { TestExecutorConfig } from "./types";
export class Config {
  readonly environments: EnvironmentReader = new EnvironmentReader();
  constructor(public envMap: Map<string, TestExecutorConfig>) {}
  get current() {
    const key = this.environments.value;
    if (!key) {
      if (!this.envMap.has("default")) {
        throw new AutomationError(
          `No environment is defined. Define an environment with 'env.byLiteral("my-environment")' or 'env.byEnvironmentVariable("MY_ENVIRONMENT")' or 'env.byFactory(() => "my-environment")' or 'env.byLiteral("default")'`
        );
      }
      return this.envMap.get("default");
    }
    if (!this.envMap.has(key)) {
      throw new AutomationError(
        `Environment ${key} is not defined. Options are: \n ${Object.keys(
          this.envMap
        ).join("\n")}`
      );
    }
    return this.envMap.get(key) ?? raise(`Environment ${key} is not defined`);
  }
}
