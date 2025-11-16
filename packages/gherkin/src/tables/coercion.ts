import type { CellContext, TablePrimitive, TableTransformer } from "./types";

export function coercePrimitive(value: string): TablePrimitive {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const maybeNumber = Number(trimmed);
  if (!Number.isNaN(maybeNumber)) {
    return maybeNumber;
  }
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  return value;
}

export function applyTransformers(
  raw: string,
  context: CellContext,
  transformer?: TableTransformer,
  coerce?: boolean
): unknown {
  if (transformer) {
    return transformer(raw, context);
  }
  if (coerce) {
    return coercePrimitive(raw);
  }
  return raw;
}
