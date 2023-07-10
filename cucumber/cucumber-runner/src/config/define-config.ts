import { Config } from "./config-manager";
import { AutometaConfig } from "./autometa-config";
import { loadGlobalStepFiles } from "../filesystem/filesystem";
/**
 * Allows the setting of configuration options
 * for the Autometa runner.
 * @param options An object setting config values to use when running tests.
 * @returns
 */
export function defineConfig(options: AutometaConfig) {
  Config.update(options);
  return loadGlobalStepFiles();
}
