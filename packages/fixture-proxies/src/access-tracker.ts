import { closestMatch } from "closest-match";
import { AutomationError } from "@autometa/errors";
import { AnyFunction } from "./any-function";

export function AccessTracker<T extends AnyFunction | object>(target: T): T {
  const accessed = new Map<string | symbol, number>();
  const assigned = new Map<string | symbol, unknown[]>();
  const rawTarget = target as Record<string | symbol, unknown>;
  for (const key of Object.keys(rawTarget)) {
    const hasValue = rawTarget[key] !== undefined;
    accessed.set(key, hasValue ? 1 : 0);
    assigned.set(key, hasValue ? [rawTarget[key]] : []);
  }
  return new Proxy<T>(target, {
    get(target: T, prop: string | symbol) {
      if (!accessed.has(prop)) {
        accessed.set(prop, 0);
      }
      if (prop === "$accessed") {
        return accessed;
      }
      if (prop === "$assigned") {
        return assigned;
      }

      const count = accessed.get(prop) as number;
      accessed.set(prop, count + 1);
      if (!(prop in target)) {
        const keys = Object.keys(target as object);
        const closest = closestMatch(prop.toString(), keys, true) ?? [];
        const hasMatches = Array.isArray(closest) && closest.length > 0;
        const messages = [
          `Attempted to access a property on the an object. This value (${prop.toString()}) has never been assigned. You might have a typo.`,
          hasMatches ? `Closest match(es) are:` : undefined,
          hasMatches
            ? Array.isArray(closest)
              ? closest.join("\n- ")
              : closest
            : undefined
        ].filter((it) => it);
        throw new AutomationError(messages.join("\n"));
      }
      return target[prop as keyof T];
    },

    set(target: T, prop: string | symbol, value: unknown) {
      if (!assigned.has(prop)) {
        assigned.set(prop, []);
      }
      assigned.get(prop)?.push(value);
      const obj = target as Record<string | symbol, unknown>;
      obj[prop] = value;
      return true;
    }
  });
}

export function GetAccessedCount<T>(arg: T, prop: keyof T) {
  const obj = arg as unknown as { $accessed: Map<keyof T, number> };
  return obj.$accessed.get(prop) ?? 0;
}

export function GetAssignedValues<T>(
  arg: T,
  prop: keyof T
): unknown[] | undefined {
  const obj = arg as unknown as { $assigned: Map<keyof T, unknown[]> };
  return obj.$assigned.get(prop) ?? [];
}

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export function DecorateAccessTracker<T extends { new (...args: any[]): {} }>(
  constructor: T
) {
  const cls = class extends constructor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      return AccessTracker(this);
    }
  };
  Object.defineProperty(cls, "name", { value: constructor.name });
  return cls;
}
