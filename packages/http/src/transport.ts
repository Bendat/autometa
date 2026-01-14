import type { HTTPRequest } from "./http-request";
import type { HTTPAdditionalOptions, StatusCode } from "./types";

export interface HTTPTransportResponse<T = unknown> {
  status: StatusCode;
  statusText: string;
  headers: Record<string, string | string[]>;
  data: T;
}

export interface HTTPTransport<TOptions = Record<string, unknown>> {
  send<TRequest, TResponse>(
    request: HTTPRequest<TRequest>,
    options: HTTPAdditionalOptions<TOptions>
  ): Promise<HTTPTransportResponse<TResponse>>;
}
