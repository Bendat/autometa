import { HTTP, HTTPError } from "@autometa/http";
// To enable HTTP request/response logging, import and use createLoggingPlugin:
import { createLoggingPlugin } from "@autometa/http";
// const http = HTTP.create({ plugins: [createLoggingPlugin(console.log)] });

import type { BrewBuddyWorld } from "../world";
import { BrewBuddyMemoryService } from "./memory";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
export type HttpMethodInput = HttpMethod | Lowercase<HttpMethod>;

export interface RequestOptions {
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly query?: Record<string, unknown>;
}

export class BrewBuddyApp {
  readonly http: HTTP;
  readonly memory: BrewBuddyMemoryService;

  constructor(http: HTTP, baseUrl: string, memory: BrewBuddyMemoryService) {
    this.http = http
      .plugin(createLoggingPlugin(console.log))
      .url(baseUrl)
      .sharedHeader("accept", "application/json")
      .sharedAllowPlainText(true);
    this.memory = memory;
  }

  request(method: HttpMethodInput, path: string, options: RequestOptions = {}) {
    const segments = normalisePath(path);
    const client = this.http
      .route(...segments)
      .headers(options.headers ?? {})
      .params(options.query ?? {})
      .data(options.body);

    return dispatch(client, method);
  }
}

export async function performRequest(
  world: BrewBuddyWorld,
  method: HttpMethodInput,
  path: string,
  options: RequestOptions = {}
): Promise<void> {
  try {
    const response = await world.app.request(method, path, options);
    world.lastResponse = response;
    world.lastResponseBody = response.data;
    world.lastResponseHeaders = normalizeHeaders(response.headers ?? {});
    delete world.lastError;
  } catch (error) {
    delete world.lastResponse;
    delete world.lastResponseBody;
    delete world.lastResponseHeaders;
    world.lastError = error;
    throw error;
  }
}

async function dispatch(client: HTTP, method: HttpMethodInput) {
  switch (method.toLowerCase()) {
    case "get":
      return client.get();
    case "post":
      return client.post();
    case "put":
      return client.put();
    case "patch":
      return client.patch();
    case "delete":
      return client.delete();
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}

export function extractErrorStatus(world: BrewBuddyWorld): number | undefined {
  const error = world.lastError;
  if (error instanceof HTTPError && error.response) {
    const status = error.response.status;
    world.lastResponse = error.response;
    world.lastResponseBody = error.response.data;
    world.lastResponseHeaders = normalizeHeaders(error.response.headers ?? {});
    return status;
  }
  return undefined;
}

function normalisePath(path: string): string[] {
  const trimmed = path.trim();
  if (!trimmed) {
    return [];
  }
  const url = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return url.split("/").filter(Boolean);
}

function normalizeHeaders(
  headers: Record<string, string>
): Record<string, string> {
  const normalised: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalised[key.toLowerCase()] = String(value);
  }
  return normalised;
}
