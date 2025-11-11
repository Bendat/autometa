import type { HTTPRequest } from "./http-request";
import type { HTTPTransport } from "./transport";
import type { HTTPAdditionalOptions, StatusCode } from "./types";

export interface AxiosRequestConfigLike extends Record<string, unknown> {
  url?: string;
  method?: string;
  headers?: Record<string, string | number | boolean | null | undefined>;
  params?: Record<string, unknown>;
  data?: unknown;
  validateStatus?: (status: number) => boolean;
}

export interface AxiosResponseLike<T = unknown> {
  status: number;
  statusText: string;
  data: T;
  headers?: Record<string, string | string[]>;
}

export interface AxiosLike {
  request<T = unknown, R = AxiosResponseLike<T>>(
    config: AxiosRequestConfigLike
  ): Promise<R>;
}

export function createAxiosTransport(
  axios: AxiosLike
): HTTPTransport<AxiosRequestConfigLike> {
  if (!axios || typeof axios.request !== "function") {
    throw new Error("Axios transport requires an axios-like client instance.");
  }

  return {
    async send<TRequest, TResponse>(
      request: HTTPRequest<TRequest>,
      options: HTTPAdditionalOptions<AxiosRequestConfigLike> = {}
    ) {
      const config: AxiosRequestConfigLike = {
        url: request.fullUrl ?? "",
        method: request.method ?? "GET",
        headers: { ...request.headers },
        params: request.params,
        data: request.data,
        validateStatus: () => true,
        ...options,
      };

      if (options.headers) {
        config.headers = mergeHeaders(config.headers ?? {}, options.headers);
      }

      const response = await axios.request<TResponse>(config);

      return {
        status: response.status as StatusCode,
        statusText: response.statusText,
        headers: response.headers ?? {},
        data: response.data,
      };
    },
  } satisfies HTTPTransport<AxiosRequestConfigLike>;
}

function mergeHeaders(
  base: Record<string, string | number | boolean | null | undefined>,
  overrides: Record<string, string | number | boolean | null | undefined>
) {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(base)) {
    if (value === undefined || value === null) {
      continue;
    }
    next[key] = String(value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) {
      delete next[key];
      continue;
    }
    next[key] = String(value);
  }
  return next;
}
