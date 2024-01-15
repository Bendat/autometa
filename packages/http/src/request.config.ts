import { HTTPMethod } from "./types";

export interface RequestBaseConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | string[] | Record<string, unknown>>;
  baseUrl?: string;
  route?: string[];
  method: HTTPMethod;
  /**
   * Returns the full URL of the request, including the base url,
   * routes, and query parameters.
   *
   * ```ts
   *  console.log(request.fullUrl())// https://example.com/foo?bar=baz?array=1,2,3
   * ```
   *
   * Note characters may be converted to escape codes. I.e (space => %20) and (comma => %2C)
   *
   * N.B this method estimates what the url will be. The actual value
   * might be different depending on your underlying HTTPClient and
   * configuration. For example, query parameters might
   * use different array formats.
   * @returns The full url of the request
   */
  get fullUrl(): string;
}

export interface RequestData<T = unknown> {
  data: T;
}

export type RequestConfig<T> = RequestBaseConfig & RequestData<T>;

export type RequestConfigBasic = RequestConfig<Record<string, unknown>>;
