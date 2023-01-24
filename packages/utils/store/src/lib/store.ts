import { injectable } from 'tsyringe';

export enum StoreAction {
  PUT = 'PUT',
  READ = 'READ',
}
export interface ValidationOptions {
  /**
   * Whether or not to print a warning message on a null or undefined value
   */
  warn?: boolean;
  /**
   * Whether or not to throw an error on a null or undefined value
   */
  throws?: boolean;
}
/**
 * A Storage model for sharing data in tests.
 *
 * Values can be written to the Store with `.put(name, value)` and
 * they can be read with `.read<Foo>(name)`.
 *
 * By default the store will validate against null and undefined values and
 * will throw an error if an empty value is provided for storage,
 * or read from storage. This can be configured with the `validateValuesNotEmpty`
 * constructor parameter.
 *
 * When enabled, `put` and `read` can also be individually configured to throw
 * an exception, or simply print an error.
 *
 * This class is injectable with and requires `tsyringe`.
 */
@injectable()
export class Store {
  #history: History = {};
  #data: Cache = {};

  /**
   * Adds a new item to the Store. If validation
   * is enabled, empty (null, undefined) values will throw an error or display a warning.
   *
   * @param name The name to store this value under
   * @param value The value to be stored
   * @param validate validation options to be used for processing. If `throws` is true, an error will be thrown on a null or undefined value. Similarly, if `warn` is true, a console warning will be printed.
   */
  put<T>(name: string, value: T, validate?: ValidationOptions) {
    this._checkHistory(name);
    const valueNotDefined = isUndefined(value);
    if (validate && valueNotDefined) {
      const { warn, throws } = validate;
      if (throws === true) {
        throwIfConfigured(name, StoreAction.PUT);
      }
      this._markFailure(name, value as undefined, warn === true);
    } else {
      this.#data[name] = value;
      this._markSuccess(name, value);
    }
  }

  /**
   * Reads a value from the Store. If validation
   * is enabled, empty (null, undefined) values will throw an error or display a warning.
   *
   * @param name The name the value is stored under for retrieval.
   * @param validate validation options to be used for processing. If `throws` is true, an error will be thrown on a null or undefined value. Similarly, if `warn` is true, a console warning will be printed.
   *
   * @returns the value whose key matches the string parameter, or undefined.
   */
  read<TReturn>(name: string, validate?: ValidationOptions): TReturn {
    const value = this.#data[name];
    const valueNotDefined = isUndefined(value);
    if (validate && valueNotDefined) {
      const { warn, throws } = validate;
      if (throws === true) {
        throwIfConfigured(name, StoreAction.READ);
      }
      if (warn === true) {
        logReadFailure(name, value as undefined);
      }
    }
    return value as TReturn;
  }

  /**
   * Generates an object detailing all the values in the test context,
   * their name, and the number of successfully or unsuccessful (null, undefined)
   * attempts to add a value with that name.
   *
   * @param forInput Filter the report to a single named entry
   * @returns An object representing the report.
   */
  generateReport(forInput: string | undefined = undefined) {
    const history = this.#history;

    if (isUndefined(forInput)) {
      return sanitizeHistoryObjects(history);
    }

    const name: string = forInput as unknown as string;
    const currentValue = history[name];

    if (isUndefined(currentValue)) {
      return noHistoryError(forInput);
    }
    const { successes, failures, values } = history[name];
    return { name: forInput, successes, failures, values };
  }

  private _checkHistory(name: string) {
    const itemHistory = this.#history[name];
    if (isUndefined(itemHistory)) {
      this.#history[name] = {
        successes: 0,
        failures: 0,
        values: [],
        accessed: function () {
          return this.successes + this.failures > 0;
        },
      };
    }
  }

  private _markFailure(name: string, value: null | undefined, warn: boolean) {
    const history = this.#history[name];
    if (warn) {
      logPutFailure(history, name, value);
    }
    this.#history[name].failures++;
    this.#history[name].values.push(value);
  }

  private _markSuccess(name: string, value: unknown) {
    this.#history[name].successes++;
    this.#history[name].values.push(value);
  }
}

function sanitizeHistoryObjects(history: History) {
  const filtered: unknown = {};
  for (const entry in history) {
    const { successes, failures, values } = history[entry];
    filtered[entry] = { successes, failures, values };
  }
  return filtered;
}

function noHistoryError(forInput: string | undefined) {
  return {
    error: {
      message: `${forInput} has no history in this Store instance. No attempt has been made to add it.`,
    },
  };
}

function logPutFailure(
  history: HistoricalItem,
  name: string,
  value: null | undefined
) {
  const overwrites = history.accessed()
    ? history.values.slice(-1)
    : 'Nothing (no prior values for this name)';
  console.warn(`Store has been provided a value which is null or undefined
  name: ${name}
  value: ${value}
  overwrites: ${overwrites}
`);
}

function isUndefined(value?: unknown) {
  return value === null || typeof value === 'undefined';
}

function logReadFailure(name: string, value: null | undefined) {
  console.warn(`Store attempted to read a value that was null or undefined
  name: ${name}
  value: ${value}
`);
}

function throwIfConfigured(name: string, action: StoreAction) {
  throw new Error(`Cannot ${action} a null or undefined value for ${name}`);
}

interface HistoricalItem {
  successes: number;
  failures: number;
  values: unknown[];
  accessed: () => boolean;
}

interface History {
  [id: string]: HistoricalItem;
}

interface Cache {
  [id: string]: unknown;
}
