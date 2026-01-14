type PlainObject = Record<string | number | symbol, unknown>;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (null === value || undefined === value) {
    return false;
  }
  if ("object" !== typeof value) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || null === proto;
}

export function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) {
    return value;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const result: PlainObject = {};
    for (const key of Object.keys(value)) {
      const entry = (value as PlainObject)[key];
      result[key] = cloneValue(entry);
    }
    return result as T;
  }
  return value;
}

export function deepMerge<T extends PlainObject, S extends PlainObject>(target: T, source: S | undefined): T & S {
  if (!source) {
    return target as T & S;
  }
  const targetRecord = target as PlainObject;
  const sourceRecord = source as PlainObject;
  for (const key of Object.keys(sourceRecord)) {
    // Protect against prototype pollution
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    const incoming = sourceRecord[key];
    if (Array.isArray(incoming)) {
      targetRecord[key] = incoming.map((item) => cloneValue(item)) as unknown;
      continue;
    }
    if (isPlainObject(incoming)) {
      const existing = isPlainObject(targetRecord[key]) ? (targetRecord[key] as PlainObject) : {};
      targetRecord[key] = deepMerge(existing, incoming as PlainObject) as unknown;
      continue;
    }
    targetRecord[key] = cloneValue(incoming) as unknown;
  }
  return target as T & S;
}

export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return !!value && "function" === typeof (value as { then?: unknown }).then;
}
