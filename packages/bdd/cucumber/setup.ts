import 'reflect-metadata';
import { useConsoleGroups } from '@autometa/logging';
import { parseBoolOrUndefined } from '@autometa/shared-utilities';
import * as dotenv from 'dotenv';
dotenv.config();
const env = {
  loggingGroups: parseBoolOrUndefined(process.env.USE_LOGGING_GROUPS),
  filterQuery: process.env.CUCUMBER_FILTER,
};

interface FlagOptions {
  loggingGroups: boolean;
}

const flags: FlagOptions = {
  loggingGroups: env.loggingGroups ?? false,
};

class FlagToggles {
  constructor(private _values: FlagOptions) {}

  get values() {
    return this._values;
  }

  /**
   * Enables logging groups. When enabled, logs
   * will be indented and unindented as tests and
   * steps complete, making it easier to understand the execution
   * of your test.
   *
   * Will not work as expected if used asynchronously or concurrently - while
   * async code can be run inside a group, groups should not be created in async code
   * that is not forced to synchronize.
   *
   * It will also likely display incorrectly when running multiple files in jest at once,
   * as they will be run concurrently. This can be worked around with `--runInBand`, however this may
   * hurt performance.
   *
   * If the environment variable `USE_LOGGING_GROUPS` is set, it will take priority.
   * When enabled, test logs will take the shape of their gherkin counterpart
   *```
   *Feature: Some Feature
   *    Scenario: Some Scenario
   *        Given some given step
   *            [Log]
   *            some user generated log
   *            /path/to/log:8:40
   *        When some when step
   *            [Info]
   *            http client recieved response: {message: 'howdy'}
   *            /path/to/log:11:9
   *
   *```
   * @returns the Flags instance this method belongs to.
   */
  enableLoggingGroups = () => {
    if (env.loggingGroups === undefined || env.loggingGroups === true) {
      this._values.loggingGroups = true;
      useConsoleGroups();
    }

    return this;
  };
}

const flagToggles = new FlagToggles(flags);

export const Flags = flagToggles;
export const Env = env;
