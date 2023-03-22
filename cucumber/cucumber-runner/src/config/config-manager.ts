import { HTable } from "@gherkin/datatables/htable";
import _ from "lodash";
import j from "joi";
import { DefaultApp } from "./default-app";
import { lie } from "src/utils/lie";
import { AutometaConfig } from "./autometa-config";
import { ConfigSchema } from "./config-schema";

const defaultOptions: Partial<AutometaConfig> = {
  app: DefaultApp,
  // eslint-disable-next-line
  tagFilter: process.env.CUCUMBER_FILTER_TAGS,
  dataTables: {
    default: HTable,
  },
};

export class ConfigManager<T> {
  actual: T;
  #cachedOriginalActual: T;
  constructor(actual: T, private schema: j.ObjectSchema) {
    this.actual = { ...actual };
    this.#cachedOriginalActual = { ...actual };
    validateConfig(schema, this.actual);
  }
  reset() {
    this.actual = { ...this.#cachedOriginalActual };
  }
  update(config: AutometaConfig) {
    _.merge(this.actual, config);
    validateConfig(this.schema, this.actual);
  }
  has(key: string, override?: AutometaConfig) {
    return Boolean(this.get(key, override));
  }

  get<T>(key: string, override?: AutometaConfig, fallback?: T): T {
    const value = _.get(override, key) ?? _.get(this.actual, key);
    if (value === undefined && fallback !== undefined) {
      return fallback;
    }
    return value;
  }

  configWith(key: string, value: unknown) {
    const newConfig = _.setWith({} as AutometaConfig, key, value, Object);
    validateConfig(this.schema, newConfig);
    return newConfig;
  }

  use(
    key: string,
    onExists: <T = unknown>(value: T) => void,
    onNotExists?: (() => void) | null,
    override?: AutometaConfig
  ) {
    const result = this.get(key, override);
    if (result) {
      onExists(result);
      return true;
    }
    onNotExists?.();
    return false;
  }
}

export const Config = new ConfigManager(lie(defaultOptions), ConfigSchema);

export function validateConfig<T extends j.ObjectSchema, K>(schema: T, newConfig: K) {
  const validate = schema.validate(newConfig);
  if (validate.error) {
    throw validate.error;
  }
}
