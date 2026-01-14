import { createToken } from "@autometa/injection";
import { HTTP, HTTPError, type HTTPResponse } from "@autometa/http";
import { App, WORLD_TOKEN, type AppFactoryContext } from "@autometa/runner";

import type { RunnerCompositionWorldBase } from "../world";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
export type HttpMethodInput = HttpMethod | Lowercase<HttpMethod>;

export interface RequestOptions {
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly query?: Record<string, unknown>;
  readonly updateHistory?: boolean;
}

export const HTTP_CLIENT = createToken<HTTP>("brew-buddy.http-client");

export class BrewBuddyHttpApp {
  readonly http: HTTP;

  private _world?: RunnerCompositionWorldBase;

  lastResponse?: HTTPResponse<unknown>;
  lastResponseBody?: unknown;
  lastResponseHeaders?: Record<string, string>;
  lastError?: unknown;

  constructor(http: HTTP) {
    this.http = http
      .sharedHeader("accept", "application/json")
      .sharedAllowPlainText(true);
  }

  set world(world: RunnerCompositionWorldBase) {
    this._world = world;
    this.http.url(world.baseUrl);
  }

  get world(): RunnerCompositionWorldBase {
    if (!this._world) {
      throw new Error("App world is not set");
    }
    return this._world;
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

  async perform(method: HttpMethodInput, path: string, options: RequestOptions = {}) {
    try {
      const response = await this.request(method, path, options);
      if (options.updateHistory !== false) {
        this.lastResponse = response;
        this.lastResponseBody = response.data;
        this.lastResponseHeaders = normalizeHeaders(response.headers ?? {});
        delete this.lastError;
      }
      if (response.status >= 400) {
        throw new HTTPError(
          `Request failed with status ${response.status}`,
          response.request,
          response
        );
      }
    } catch (error) {
      if (options.updateHistory !== false) {
        delete this.lastResponse;
        delete this.lastResponseBody;
        delete this.lastResponseHeaders;
        this.lastError = error;
      }
      throw error;
    }
  }

  extractErrorStatus(): number | undefined {
    const error = this.lastError;
    if (error instanceof HTTPError && error.response) {
      const status = error.response.status;
      this.lastResponse = error.response;
      this.lastResponseBody = error.response.data;
      this.lastResponseHeaders = normalizeHeaders(error.response.headers ?? {});
      return status;
    }
    return undefined;
  }
}

export function registerApp(compose: AppFactoryContext<RunnerCompositionWorldBase>): void {
  compose
    .registerFactory(HTTP_CLIENT, () => HTTP.create())
    .registerClass(BrewBuddyHttpApp, {
      deps: [HTTP_CLIENT],
      inject: {
        world: { token: WORLD_TOKEN },
      },
    });
}

export const CompositionRoot = App.compositionRoot(BrewBuddyHttpApp, {
  setup: registerApp,
});

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

function normalisePath(path: string): string[] {
  const trimmed = path.trim();
  if (!trimmed) {
    return [];
  }
  const url = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return url.split("/").filter(Boolean);
}

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  const normalised: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalised[key.toLowerCase()] = String(value);
  }
  return normalised;
}
