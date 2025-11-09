import { AutomationError } from "@autometa/errors";

const ERROR_BOUNDARY_CACHE = new WeakSet<object>();

export interface ErrorBoundaryOptions<T extends object> {
  /**
   * Filter which methods should be wrapped. Defaults to own enumerable functions.
   */
  include?: (payload: MethodIntrospection<T>) => boolean;
  /**
   * Customise the error message.
   */
  formatMessage?: (payload: ErrorPayload<T>) => string;
  /**
   * Transform the thrown error before it is rethrown as AutomationError.
   */
  transform?: (payload: ErrorPayload<T>) => unknown;
}

export interface MethodIntrospection<T extends object> {
  readonly key: PropertyKey;
  readonly target: T;
  readonly descriptor: PropertyDescriptor;
}

export interface ErrorPayload<T extends object> {
  readonly method: PropertyKey;
  readonly target: T;
  readonly error: unknown;
}

const defaultInclude = <T extends object>({ descriptor }: MethodIntrospection<T>): boolean => {
  return typeof descriptor.value === "function";
};

export function withErrorBoundary<T extends object>(
  target: T,
  options: ErrorBoundaryOptions<T> = {}
): T {
  if (ERROR_BOUNDARY_CACHE.has(target)) {
    return target;
  }

  const include = options.include ?? defaultInclude;
  const visited = new Set<PropertyKey>();

  let proto: object | null = target;
  while (proto && proto !== Object.prototype) {
    for (const key of Reflect.ownKeys(proto)) {
      if (key === "constructor" || visited.has(key)) {
        continue;
      }

      const descriptor = Reflect.getOwnPropertyDescriptor(proto, key);
      if (!descriptor) {
        continue;
      }

      const introspection: MethodIntrospection<T> = {
        key,
        target,
        descriptor,
      };

      if (!include(introspection)) {
        continue;
      }

      const original = descriptor.value as unknown;
      if (typeof original !== "function") {
        continue;
      }

      const wrapped = createWrappedMethod(
        original as (...args: unknown[]) => unknown,
        key,
        target,
        options
      );

      Reflect.defineProperty(target, key, {
        configurable: true,
        enumerable: descriptor.enumerable ?? false,
        writable: descriptor.writable ?? true,
        value: wrapped,
      });

      visited.add(key);
    }
    proto = Object.getPrototypeOf(proto);
  }

  ERROR_BOUNDARY_CACHE.add(target);
  return target;
}

function createWrappedMethod<T extends object>(
  original: (...args: unknown[]) => unknown,
  key: PropertyKey,
  target: T,
  options: ErrorBoundaryOptions<T>
) {
  const wrapper = function wrapped(this: unknown, ...args: unknown[]) {
    try {
      const result = original.apply(this ?? target, args);
      if (isPromise(result)) {
        return result.catch((error) => {
          throw createAutomationError<T>(key, target, error, options);
        });
      }
      return result;
    } catch (error) {
      throw createAutomationError<T>(key, target, error, options);
    }
  };

  Object.defineProperty(wrapper, "name", {
    value: original.name || (typeof key === "string" ? key : "wrapped"),
    configurable: true,
  });

  return wrapper;
}

function isPromise(value: unknown): value is Promise<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

function createAutomationError<T extends object>(
  method: PropertyKey,
  target: T,
  error: unknown,
  options: ErrorBoundaryOptions<T>
): AutomationError {
  const payload: ErrorPayload<T> = { method, target, error };
  const message = options.formatMessage
    ? options.formatMessage(payload)
    : defaultErrorMessage(payload);
  const transformed = options.transform ? options.transform(payload) : error;

  if (transformed instanceof AutomationError) {
    return transformed;
  }

  return new AutomationError(message, {
    cause: transformed instanceof Error ? transformed : undefined,
  });
}

function defaultErrorMessage({ method, target }: ErrorPayload<object>): string {
  const targetName = getTargetName(target);
  return `An error occurred in ${targetName}.${String(method)}.`;
}

function getTargetName(target: object): string {
  if (typeof target === "function") {
    return target.name || "anonymous";
  }

  const ctor = (target as { constructor?: { name?: string } }).constructor;
  return ctor?.name ?? "Object";
}
