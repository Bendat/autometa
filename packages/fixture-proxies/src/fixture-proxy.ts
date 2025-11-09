import type { AccessTrackerOptions } from "./access-tracker";
import {
  getAccessDiagnostics,
  getAssignedValues,
  getReadCount,
  withAccessTracking,
} from "./access-tracker";
import type { ErrorBoundaryOptions } from "./error-boundary";
import { withErrorBoundary } from "./error-boundary";

export interface FixtureProxyOptions<T extends object> {
  /**
   * Configure access tracking. Pass `false` to disable instrumentation.
   */
  access?: boolean | AccessTrackerOptions<T>;
  /**
   * Configure error boundary wrapping. Pass `false` to disable instrumention.
   */
  errors?: boolean | ErrorBoundaryOptions<T>;
}

export interface FixtureProxy<T extends object> {
  readonly value: T;
}

export function createFixtureProxy<T extends object>(
  target: T,
  options: FixtureProxyOptions<T> = {}
): FixtureProxy<T> {
  let result = target;

  if (options.access !== false) {
    const accessOptions = options.access === true || options.access === undefined ? {} : options.access;
    result = withAccessTracking(result, accessOptions);
  }

  if (options.errors !== false) {
    const errorOptions = options.errors === true || options.errors === undefined ? {} : options.errors;
    result = withErrorBoundary(result, errorOptions);
  }

  return {
    value: result,
  } satisfies FixtureProxy<T>;
}

export const FixtureProxy = {
  create: createFixtureProxy,
  reads: getReadCount,
  writes: getAssignedValues,
  diagnostics: getAccessDiagnostics,
};

export type { AccessTrackerOptions, ErrorBoundaryOptions };
