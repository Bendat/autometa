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
