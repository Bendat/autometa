export class EnvPrioritySetting<T extends number | string | boolean> {
  constructor(
    private readonly envVar: T | undefined,
    private setValue: T | undefined
  ) {}

  get = () => {
    return this.envVar ?? this.setValue;
  };

  set = (value: T) => {
    if (!this.envVar) {
      this.setValue = value;
    }
  };
}

export const ComponentSettings = new (class ComponentSettings {
  #slowMode = new EnvPrioritySetting<number>(getEnvSlowMode(), 0);
  #componentLogging = new EnvPrioritySetting<boolean>(
    getEnvComponentLogging(),
    true
  );
  #logComponentDetails = new EnvPrioritySetting<boolean>(
    getEnvComponentDetails(),
    true
  );

  #logComponentAutoWait = new EnvPrioritySetting<boolean>(
    getEnvComponentAutoWait(),
    true
  );

  getSlowMode = () => {
    return this.#slowMode.get();
  };

  setSlowMode = (milliseconds: number) => {
    this.#slowMode.set(milliseconds);
    return this;
  };

  enableComponentLogs = (flag: boolean) => {
    this.#componentLogging.set(flag);
    return this;
  };

  shouldComponentsLog = () => {
    return this.#componentLogging.get();
  };

  enableComponentLogsDetails = (flag: boolean) => {
    this.#logComponentDetails.set(flag);
    return this;
  };

  shouldComponentsLogDetails = () => {
    return this.#logComponentDetails.get();
  };

  enableComponentAutoWait = (flag: boolean) => {
    this.#logComponentAutoWait.set(flag);
    return this;
  };

  shouldComponentsAutoWait = () => {
    return this.#logComponentAutoWait.get();
  };
})();

function getEnvSlowMode() {
  const env = process.env.SELENIUM_POM_SLOW_MODE_MS;
  if (env) {
    return parseInt(env);
  }
  if (env === undefined) {
    return undefined;
  }

  throw new Error(
    `Could not parse environment variable SELENIUM_SLOW_MODE_MS. Value must be an integer. Found '${env}'`
  );
}

function getEnvComponentLogging() {
  const env = process.env.SELENIUM_POM_COMPONENT_LOGGING;
  return getBoolEnv(env);
}

function getEnvComponentDetails() {
  const env = process.env.SELENIUM_POM_LOG_COMPONENT_DETAILS;
  return getBoolEnv(env);
}

function getEnvComponentAutoWait() {
  const env = process.env.SELENIUM_POM_AUTO_WAIT;
  return getBoolEnv(env);
}

function getBoolEnv(key?: string) {
  const env = process.env[key ?? '____no_key___'];
  if (env === 'true' || env === 'enabled') {
    return true;
  }
  if (env === 'false' || env === 'disabled') {
    return false;
  }
  if (env === undefined) {
    return undefined;
  }
  throw new Error(
    `Could not parse environment variable ${key}. Accepted values are: [${[
      true,
      'enabled',
      false,
      'disabled',
      undefined,
    ]}]. Found '${env}`
  );
}
