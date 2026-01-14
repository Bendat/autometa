export function AnySchema<T = unknown>(data: T) {
  return data;
}

export function EmptySchema(data: unknown) {
  if (data !== null && data !== undefined && data !== "null") {
    throw new Error(`Expected null but received ${describeValue(data)}`);
  }
  return data === "null" ? null : data;
}

export function NullSchema(data: unknown) {
  if (data !== null && data !== "null") {
    throw new Error(`Expected null but received ${describeValue(data)}`);
  }
  return null;
}

export function UndefinedSchema(data: unknown) {
  if (data !== undefined) {
    throw new Error(`Expected undefined but received ${describeValue(data)}`);
  }
  return undefined;
}

export function BooleanSchema(data: unknown) {
  if (
    typeof data === "boolean" ||
    (typeof data === "string" && ["true", "false"].includes(data))
  ) {
    return typeof data === "boolean" ? data : data === "true";
  }
  throw new Error(`Expected boolean but received ${describeValue(data)}`);
}

export function NumberSchema(data: unknown) {
  if (typeof data === "number") {
    return data;
  }
  if (typeof data === "string" && /^(?:\d+|\d*\.\d+)$/.test(data)) {
    return Number(data);
  }
  throw new Error(`Expected number but received ${describeValue(data)}`);
}

export function StringSchema(data: unknown) {
  if (typeof data === "string") {
    return data;
  }
  throw new Error(`Expected string but received ${describeValue(data)}`);
}

export function JSONSchema<T = unknown>(data: unknown) {
  if (typeof data === "object" && data !== null) {
    return data as T;
  }
  if (typeof data === "string") {
    const parsed = tryParseJson<T>(data);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  throw new Error(`Expected JSON but received ${describeValue(data)}`);
}

function describeValue(value: unknown) {
  return `<${typeof value}> ${String(value)}`;
}

function tryParseJson<T>(value: string) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}
