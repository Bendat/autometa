import { closestMatch } from "closest-match";
import { AutomationError } from "@autometa/errors";

const ACCESS_METADATA = new WeakMap<object, AccessDiagnostics>();
const ACCESS_PROXY_CACHE = new WeakMap<object, object>();

export type PropertyKeyOf<T> = Extract<keyof T, string | symbol>;

export interface AccessDiagnostics {
  readonly reads: Map<PropertyKey, number>;
  readonly writes: Map<PropertyKey, unknown[]>;
}

export interface AccessViolation<T extends object> {
  readonly property: PropertyKeyOf<T> | string;
  readonly suggestions: string[];
  readonly target: T;
}

export interface AccessTrackerOptions<T extends object> {
  /**
   * Properties that are expected to be missing at runtime.
   * Accessing these keys will not trigger a violation.
   */
  allow?: Array<PropertyKeyOf<T>>;
  /**
   * Custom handler invoked when an unknown property is read.
   * Throw inside to override the default AutomationError behaviour.
   */
  onViolation?: (violation: AccessViolation<T>) => never | void;
  /**
   * Controls whether to emit closest-match suggestions.
   * Provide a number to clamp the maximum suggestions returned.
   */
  suggestClosest?: boolean | number;
  /**
   * Override the violation message used when throwing AutomationError.
   */
  formatMessage?: (violation: AccessViolation<T>) => string;
}

const DEFAULT_SUGGESTION_LIMIT = 3;

function ensureDiagnostics(target: object): AccessDiagnostics {
  let diagnostics = ACCESS_METADATA.get(target);
  if (!diagnostics) {
    diagnostics = {
      reads: new Map<PropertyKey, number>(),
      writes: new Map<PropertyKey, unknown[]>(),
    } satisfies AccessDiagnostics;
    ACCESS_METADATA.set(target, diagnostics);
  }
  return diagnostics;
}

function normaliseAllowList<T extends object>(allow?: Array<PropertyKeyOf<T>>): Set<PropertyKey> {
  return new Set<PropertyKey>(allow ?? []);
}

function recordInitialValues(target: object, diagnostics: AccessDiagnostics) {
  for (const key of Reflect.ownKeys(target)) {
    const value = (target as Record<PropertyKey, unknown>)[key];
    diagnostics.reads.set(key, value === undefined ? 0 : 1);
    diagnostics.writes.set(key, value === undefined ? [] : [value]);
  }
}

function resolveSuggestions(target: object, property: PropertyKey, limit: number): string[] {
  const keys = Reflect.ownKeys(target)
    .filter((key) => typeof key === "string")
    .map((key) => key as string);
  if (!keys.length) {
    return [];
  }
  const matches = closestMatch(property.toString(), keys, true) ?? [];
  if (Array.isArray(matches)) {
    return matches.slice(0, limit);
  }
  return [matches];
}

export function withAccessTracking<T extends object>(
  target: T,
  options: AccessTrackerOptions<T> = {}
): T {
  const cached = ACCESS_PROXY_CACHE.get(target);
  if (cached) {
    return cached as T;
  }

  const allowList = normaliseAllowList(options.allow);
  const diagnostics = ensureDiagnostics(target);
  recordInitialValues(target, diagnostics);

  const suggestionLimit =
    typeof options.suggestClosest === "number"
      ? Math.max(0, options.suggestClosest)
      : DEFAULT_SUGGESTION_LIMIT;

  const shouldSuggest = options.suggestClosest !== false && suggestionLimit > 0;

  const proxy = new Proxy(target, {
    get(original, property, receiver) {
      const activeDiagnostics = ACCESS_METADATA.get(receiver) ?? diagnostics;
      if (!activeDiagnostics.reads.has(property)) {
        activeDiagnostics.reads.set(property, 0);
      }
      const nextCount = (activeDiagnostics.reads.get(property) ?? 0) + 1;
      activeDiagnostics.reads.set(property, nextCount);

      if (
        property in original ||
        allowList.has(property as PropertyKey) ||
        typeof property === "symbol"
      ) {
        return Reflect.get(original, property, receiver);
      }

      const violation: AccessViolation<T> = {
        property: property as PropertyKeyOf<T>,
        suggestions: shouldSuggest
          ? resolveSuggestions(original, property, suggestionLimit)
          : [],
        target: receiver as T,
      };

      if (options.onViolation) {
        options.onViolation(violation);
      }

      const message = options.formatMessage
        ? options.formatMessage(violation)
        : defaultViolationMessage(violation);

      throw new AutomationError(message);
    },
    set(original, property, value, receiver) {
      const activeDiagnostics = ensureDiagnostics(receiver);
      if (!activeDiagnostics.writes.has(property)) {
        activeDiagnostics.writes.set(property, []);
      }
      activeDiagnostics.writes.get(property)?.push(value);
      return Reflect.set(original, property, value, receiver);
    },
  });

  ACCESS_PROXY_CACHE.set(target, proxy);
  ACCESS_METADATA.set(proxy, diagnostics);
  return proxy;
}

export function getAccessDiagnostics(target: object): AccessDiagnostics | undefined {
  return ACCESS_METADATA.get(target);
}

export function getReadCount<T extends object>(target: T, property: PropertyKeyOf<T>): number {
  return getAccessDiagnostics(target)?.reads.get(property) ?? 0;
}

export function getAssignedValues<T extends object>(
  target: T,
  property: PropertyKeyOf<T>
): unknown[] {
  return getAccessDiagnostics(target)?.writes.get(property) ?? [];
}

function defaultViolationMessage({ property, suggestions }: AccessViolation<object>): string;
function defaultViolationMessage({ property, suggestions }: { property: PropertyKey; suggestions: string[] }): string;
function defaultViolationMessage({ property, suggestions }: { property: PropertyKey; suggestions: string[] }): string {
  const base = `Attempted to access '${String(property)}' before it was assigned.`;
  if (!suggestions.length) {
    return base;
  }
  const suffix = suggestions.map((match) => `- ${match}`).join("\n");
  return `${base}\nDid you mean:\n${suffix}`;
}
