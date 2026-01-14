import { AutomationError } from "@autometa/errors";
import { highlight } from "cli-highlight";

export function transformResponse(
  allowPlainText: boolean,
  data: unknown
): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    const trimmed = data.trim();
    if (trimmed.length === 0) {
      return undefined;
    }
    if (trimmed.toLowerCase() === "undefined") {
      return undefined;
    }
  }

  const primitive = normalizePrimitive(data);
  if (primitive !== undefined) {
    return primitive;
  }

  if (typeof data === "object") {
    return data;
  }

  if (allowPlainText) {
    return String(data);
  }

  const rendered = typeof data === "string" ? data : String(data);
  const message = [
    "Could not parse response as JSON and plain text responses are disabled.",
    "Call 'allowPlainText(true)' or 'sharedAllowPlainText(true)' to permit plain text responses.",
    "",
    highlight(rendered, { language: "html" }),
  ].join("\n");
  throw new AutomationError(message);
}

function normalizePrimitive(data: unknown): unknown {
  if (typeof data === "string") {
    const parsed = tryParseJson(data);
    if (parsed !== undefined) {
      return parsed;
    }
    const lowered = data.toLowerCase();
    if (lowered === "true" || lowered === "false") {
      return lowered === "true";
    }
    if (/^(?:\d+|\d*\.\d+)$/.test(data)) {
      return Number(data);
    }
    return undefined;
  }

  if (isArrayBufferLike(data)) {
    const text = bufferToString(data);
    return normalizePrimitive(text) ?? text;
  }

  if (typeof data === "boolean" || typeof data === "number") {
    return data;
  }

  return undefined;
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isArrayBufferLike(value: unknown): value is ArrayBufferView | ArrayBuffer {
  return (
    (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) ||
    (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value))
  );
}

function bufferToString(value: ArrayBuffer | ArrayBufferView) {
  const view: Uint8Array =
    value instanceof ArrayBuffer
      ? new Uint8Array(value)
      : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(view);
  }
  let output = "";
  for (let i = 0; i < view.length; i++) {
    const code = view[i];
    if (code === undefined) {
      continue;
    }
    output += String.fromCharCode(code);
  }
  return output;
}
