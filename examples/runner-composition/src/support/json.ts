const BRACKET_TOKEN = /\[(?<key>[^\]]+)\]/g;

export function splitPath(path: string): string[] {
  const normalized = path.trim();
  if (!normalized) {
    return [];
  }

  const expanded = normalized.replace(
    BRACKET_TOKEN,
    (_match, key: string) => `.${key}`
  );
  return expanded
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

export function resolveJsonPath(source: unknown, path: string): unknown {
  if (path === "" || path === "$") {
    return source;
  }

  const segments = splitPath(path);
  if (segments.length === 0) {
    return source;
  }

  let current: unknown = source;
  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = Number(segment);
      current = Number.isInteger(index) ? current[index] : undefined;
      continue;
    }

    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
      continue;
    }

    return undefined;
  }

  return current;
}

export function coercePrimitive(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "";
  }

  if (trimmed.toLowerCase() === "true") {
    return true;
  }

  if (trimmed.toLowerCase() === "false") {
    return false;
  }

  if (trimmed.toLowerCase() === "null") {
    return null;
  }

  if (trimmed.toLowerCase() === "undefined") {
    return undefined;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];

  if (
    (firstChar === "{" && lastChar === "}") ||
    (firstChar === "[" && lastChar === "]")
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  if (firstChar === '"' && lastChar === '"' && trimmed.length >= 2) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }

  return trimmed;
}

export function normalizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return coercePrimitive(value);
  }
  return value;
}
