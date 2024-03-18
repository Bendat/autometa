import { Config } from "./config-object";
import { EnvironmentReader } from "./environment-reader";
import { TestExecutorConfig } from "./types";
import { AutomationError } from "@autometa/errors";
export function defineConfig(config: Config, ...configs: TestExecutorConfig[]) {
  const envs: string[] = [];
  const envMap = config.envMap;
  for (const config of configs) {
    if (config.environment) {
      if (envs.includes(config.environment)) {
        throw new AutomationError(
          `Environment ${config.environment} is defined more than once`
        );
      }
      envMap.set(config.environment, config);
      envs.push(config.environment);
    } else if (!config.environment && envs.includes("default")) {
      throw new AutomationError(`Only one default environment can be defined`);
    } else {
      envMap.set("default", config);
      envs.push("default");
      config.environment = "default";
    }
    if (config.shim) {
      if ("error-cause" in config.shim && config.shim["error-cause"] === true) {
        require("error-cause/auto");
      }
    }
  }
  if (envs.length > 1 && !envs.includes("default")) {
    throw new AutomationError(
      `A default environment must be defined first. At one config must not have an environment defined or define a default environment explicitly with 'environement="default"`
    );
  }
  const setters = config.environments as {
    byLiteral: (literal: string) => EnvironmentReader;
    byEnvironmentVariable: (name: string) => EnvironmentReader;
    byFactory: (action: () => string) => EnvironmentReader;
  };
  return {
    env: setters,
  };
}
