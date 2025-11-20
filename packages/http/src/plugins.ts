import type { HTTPRequest } from "./http-request";
import type { HTTPResponse } from "./http-response";
import type { HTTPAdditionalOptions } from "./types";

export interface HTTPRequestContext<TOptions = HTTPAdditionalOptions> {
  request: HTTPRequest<unknown>;
  options: HTTPAdditionalOptions<TOptions>;
}

export interface HTTPResponseContext<
  TResponse = unknown,
  TOptions = HTTPAdditionalOptions
> {
  request: HTTPRequest<unknown>;
  response: HTTPResponse<TResponse>;
  options: HTTPAdditionalOptions<TOptions>;
}

export interface HTTPErrorContext<TOptions = HTTPAdditionalOptions> {
  request: HTTPRequest<unknown>;
  options: HTTPAdditionalOptions<TOptions>;
  error: unknown;
}

export interface HTTPPlugin {
  name?: string;
  onRequest?(context: HTTPRequestContext): Promise<void> | void;
  onResponse?(context: HTTPResponseContext): Promise<void> | void;
  onError?(context: HTTPErrorContext): Promise<void> | void;
}

export type HTTPLogEvent =
  | {
      type: "request";
      timestamp: number;
      request: HTTPRequest<unknown>;
      options: HTTPAdditionalOptions<Record<string, unknown>>;
    }
  | {
      type: "response";
      timestamp: number;
      request: HTTPRequest<unknown>;
      response: HTTPResponse<unknown>;
      options: HTTPAdditionalOptions<Record<string, unknown>>;
    }
  | {
      type: "error";
      timestamp: number;
      request: HTTPRequest<unknown>;
      error: unknown;
      options: HTTPAdditionalOptions<Record<string, unknown>>;
    };

export type HTTPLogSink = (event: HTTPLogEvent) => void | Promise<void>;

export function createLoggingPlugin(sink: HTTPLogSink): HTTPPlugin {
  return {
    name: "http-logging",
    async onRequest(context) {
      await sink({
        type: "request",
        timestamp: Date.now(),
        request: context.request,
        options: context.options,
      });
    },
    async onResponse(context) {
      await sink({
        type: "response",
        timestamp: Date.now(),
        request: context.request,
        response: context.response,
        options: context.options,
      });
    },
    async onError(context) {
      await sink({
        type: "error",
        timestamp: Date.now(),
        request: context.request,
        error: context.error,
        options: context.options,
      });
    },
  } satisfies HTTPPlugin;
}
