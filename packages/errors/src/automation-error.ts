export interface AutomationErrorOptions {
  readonly cause?: unknown;
}

/**
 * Base error type emitted by Autometa utilities.
 */
export class AutomationError extends Error {
  readonly cause?: unknown;

  constructor(message: string, options: AutomationErrorOptions = {}) {
    const { cause } = options;
    super(message);
    this.name = "AutomationError";
    if (cause !== undefined) {
      Object.defineProperty(this, "cause", {
        configurable: true,
        enumerable: false,
        writable: false,
        value: cause,
      });
    }
  }

  static isAutomationError(value: unknown): value is AutomationError {
    return value instanceof AutomationError;
  }

  static wrap(value: unknown, fallbackMessage = "Unknown error"): AutomationError {
    if (value instanceof AutomationError) {
      return value;
    }

    if (value instanceof Error) {
      return new AutomationError(value.message, { cause: value });
    }

    if (typeof value === "string") {
      return new AutomationError(value);
    }

    return new AutomationError(fallbackMessage, { cause: value });
  }
}
