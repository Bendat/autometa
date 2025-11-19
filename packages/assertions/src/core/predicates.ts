export function isRecord(candidate: unknown): candidate is Record<PropertyKey, unknown> {
  return typeof candidate === "object" && candidate !== null;
}

export function isIterable(candidate: unknown): candidate is Iterable<unknown> {
  return typeof (candidate as { [Symbol.iterator]?: unknown })?.[Symbol.iterator] === "function";
}

export function hasLengthProperty(candidate: unknown): candidate is { length: number } {
  return typeof (candidate as { length?: unknown })?.length === "number";
}
