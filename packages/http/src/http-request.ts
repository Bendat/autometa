import { RequestConfig, RequestConfigBasic } from "./request.config";
import { HTTPMethod } from "./types";
import { urlJoinP } from "url-join-ts";
export class HTTPRequest<T = unknown> implements RequestConfig<T> {
  headers: Record<string, string> = {};
  params: Record<string, string | string[] | Record<string, unknown>> = {};
  baseUrl?: string;
  route: string[] = [];
  method: HTTPMethod;
  data: T;

  constructor(config?: RequestConfigBasic) {
    Object.assign(this, config);
  }

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
   */
  fullUrl() {
    return urlJoinP(this.baseUrl, this.route, this.params);
  }

  /**
   * Returns a new independent copy of the request.
   */
  static derive(original: HTTPRequest<unknown>) {
    const request = new HTTPRequest();
    request.headers = { ...original.headers };
    request.params = { ...original.params };
    request.baseUrl = original.baseUrl;
    request.route = [...original.route];
    request.method = original.method;
    request.data = original.data;
    return request;
  }
}

export class HTTPRequestBuilder<T extends HTTPRequest<unknown>> {
  #request: T;
  #dynamicHeaders = new Map<string, () => string | number | boolean | null>();

  constructor(request: T | (() => T) = () => new HTTPRequest() as T) {
    if (typeof request === "function") {
      this.#request = request();
      return;
    }
    this.#request = request;
  }

  static create<T extends HTTPRequest<unknown>>() {
    return new HTTPRequestBuilder<T>();
  }

  get request() {
    return this.#request;
  }

  resolveDynamicHeaders() {
    for (const [name, value] of this.#dynamicHeaders) {
      try {
        this.#request.headers[name] = String(value());
      } catch (e) {
        const cause = e as Error;
        const msg = `Failed to resolve dynamic header "${name}": 
${cause}`;
        throw new Error(msg);
      }
    }
    return this;
  }

  url(url: string) {
    this.#request.baseUrl = url;
    return this;
  }

  route(...route: string[]) {
    this.#request.route.push(...route);
    return this;
  }

  param(
    name: string,
    value:
      | string
      | number
      | boolean
      | (string | number | boolean)[]
      | Record<string, string | number | boolean>
  ) {
    if (Array.isArray(value)) {
      const asStr = value.map(String);
      this.#request.params[name] = asStr;
      return this;
    }
    if (!Array.isArray(value) && typeof value === "object") {
      this.#request.params[name] = value;
      return this;
    }
    this.#request.params[name] = String(value);
    return this;
  }

  params(dict: Record<string, unknown>) {
    Object.assign(this.#request.params, dict);
    return this;
  }

  data<T>(data: T) {
    this.#request.data = data;
    return this;
  }

  header(
    name: string,
    value:
      | string
      | number
      | boolean
      | null
      | (() => string | number | boolean | null)
  ) {
    if (typeof value === "function") {
      value = value();
    }
    this.#request.headers[name] = String(value);
    return this;
  }

  headers(dict: Record<string, string>) {
    Object.assign(this.#request.headers, dict);
    return this;
  }

  get() {
    return this.#request;
  }

  method(method: HTTPMethod) {
    this.#request.method = method;
    return this;
  }

  derive(): HTTPRequestBuilder<T> {
    const request = HTTPRequest.derive(this.#request);
    return new HTTPRequestBuilder(request) as HTTPRequestBuilder<T>;
  }

  build(): HTTPRequest<T> {
    return this.#request as HTTPRequest<T>;
  }
}
