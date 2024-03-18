import {
  Config,
  TestExecutorConfig,
  defineConfig as dc,
} from "@autometa/config";

export const CONFIG = new Config(new Map<string, TestExecutorConfig>());
export const defineConfig = dc.bind(null, CONFIG);
