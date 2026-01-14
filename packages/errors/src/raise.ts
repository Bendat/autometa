import { AutomationError, type AutomationErrorOptions } from "./automation-error";

type AutomationErrorConstructor<TError extends Error> = new (
  message: string,
  options?: AutomationErrorOptions
) => TError;

export interface RaiseOptions<TError extends Error = AutomationError> extends AutomationErrorOptions {
  readonly type?: AutomationErrorConstructor<TError> | (new (message: string) => TError);
}

function assignCause(instance: Error, cause: unknown): void {
  Object.defineProperty(instance, "cause", {
    configurable: true,
    enumerable: false,
    writable: false,
    value: cause,
  });
}

function supportsCauseSignature<TError extends Error>(ctor: AutomationErrorConstructor<TError>): boolean {
  try {
    // eslint-disable-next-line no-new
    new ctor("probe", { cause: undefined });
    return true;
  } catch {
    return false;
  }
}

function buildError<TError extends Error>(
  type: AutomationErrorConstructor<TError> | (new (message: string) => TError),
  message: string,
  options: AutomationErrorOptions
): TError {
  if (supportsCauseSignature(type as AutomationErrorConstructor<TError>)) {
    return new (type as AutomationErrorConstructor<TError>)(message, options);
  }

  const instance = new type(message);
  if (options.cause !== undefined) {
    assignCause(instance, options.cause);
  }
  return instance;
}

/**
 * Construct and throw an {@link AutomationError} (or custom error) with the provided message.
 */
export function raise<TError extends Error = AutomationError>(
  message: string,
  options: RaiseOptions<TError> = {}
): never {
  const { type, cause } = options;
  const automationOptions: AutomationErrorOptions = cause === undefined ? {} : { cause };

  const error = type ? buildError(type, message, automationOptions) : new AutomationError(message, automationOptions);
  throw error;
}
