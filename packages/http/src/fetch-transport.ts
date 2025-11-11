import type { HTTPRequest } from "./http-request";
import type { HTTPTransport } from "./transport";
import type { HTTPAdditionalOptions, StatusCode } from "./types";

export interface FetchRequestOptions extends Record<string, unknown> {
  headers?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  method?: string;
}

export interface FetchResponseLike {
  status: number;
  statusText: string;
  headers: HeadersLike;
  text(): Promise<string>;
}

export interface HeadersLike {
  forEach(callback: (value: string, key: string) => void): void;
}

export type FetchLike = (
  input: string,
  init?: FetchRequestOptions
) => Promise<FetchResponseLike>;

export function createFetchTransport(
  fetchImpl: FetchLike = globalThis.fetch as FetchLike
): HTTPTransport<FetchRequestOptions> {
  if (!fetchImpl) {
    throw new Error(
      "No fetch implementation available. Provide one via createFetchTransport(fetchImpl)."
    );
  }

  return {
    async send<TRequest, TResponse>(
      request: HTTPRequest<TRequest>,
      options: HTTPAdditionalOptions<FetchRequestOptions> = {}
    ) {
      const { headers: optionHeaders, body: optionBody, ...restOptions } = options;
      const headers = mergeHeaders(request.headers, optionHeaders);

      const body = optionBody ?? createBody(request, headers);

      const url = request.fullUrl ?? "";
      const response = await fetchImpl(url, {
        ...restOptions,
        method: request.method ?? "GET",
        headers,
        body,
      });

      const data = await readBody(response);
      return {
        status: response.status as StatusCode,
        statusText: response.statusText,
        headers: headersToRecord(response.headers),
        data: data as TResponse,
      };
    },
  } satisfies HTTPTransport<FetchRequestOptions>;
}

function mergeHeaders(
  base: Record<string, string>,
  additional?: Record<string, string | number | boolean | null | undefined>
) {
  const next: Record<string, string> = { ...base };
  if (!additional) {
    return next;
  }
  for (const [key, value] of Object.entries(additional)) {
    if (value === undefined || value === null) {
      delete next[key];
    } else {
      next[key] = String(value);
    }
  }
  return next;
}

function createBody(request: HTTPRequest<unknown>, headers: Record<string, string>) {
  const { data } = request;
  if (data === undefined || data === null) {
    return undefined;
  }

  if (isBodyInit(data)) {
    return data;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object") {
    if (!hasHeader(headers, "content-type")) {
      headers["content-type"] = "application/json";
    }
    return JSON.stringify(data);
  }

  return String(data);
}

async function readBody(response: FetchResponseLike) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  const text = await response.text();
  return text.length === 0 ? null : text;
}

function headersToRecord(headers: HeadersLike) {
  const record: Record<string, string | string[]> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function hasHeader(headers: Record<string, string>, name: string) {
  const lower = name.toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === lower);
}

function isBodyInit(value: unknown): value is string | ArrayBuffer | ArrayBufferView {
  if (typeof value === "string") {
    return true;
  }
  if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
    return true;
  }
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value)) {
    return true;
  }
  return false;
}
