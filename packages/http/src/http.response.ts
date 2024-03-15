import { HTTPRequest } from "./http.request";
import { StatusCode } from "./types";

export class HTTPResponse<T = unknown> {
  status: StatusCode;
  statusText: string;
  data: T;
  headers: Record<string, string>;
  request: HTTPRequest<unknown>;

  constructor() {
    this.headers = {};
  }

  static fromRaw<T>(response: HTTPResponse<T>) {
    const newResponse = new HTTPResponse<T>();
    Object.assign(newResponse, response);
    return response;
  }

  /**
   * Decomposes a response, creating an exact copy of the current response,
   * but with a new data value. The data can be provided directly as is, or it
   * can be generated through a callback function which receives the current
   * response data as an argument.
   *
   * ```ts
   * const response = await http.get("/products");
   *
   * // direct value
   * const products = response.data;
   * const firstProduct = response.decompose(products[0]);
   * // callback transformer
   * const secondProduct = response.decompose((products) => products[1]);
   * // callback transformer with destructuring
   * const secondProduct = response.decompose(([product]) => product);
   * ```
   * @param value
   */
  decompose<K>(value: K): HTTPResponse<K>;
  decompose<K>(transformFn: (response: T) => K): HTTPResponse<K>;
  decompose<K>(transformFnOrVal: K | ((response: T) => K)): HTTPResponse<K> {
    const value = getDecompositionValue<T>(this.data, transformFnOrVal);
    return new HTTPResponseBuilder()
      .status(this.status)
      .statusText(this.statusText)
      .headers(this.headers)
      .request(this.request)
      .data(value)
      .build() as HTTPResponse<K>;
  }
}

function getDecompositionValue<T>(data: unknown, transformFn: unknown): T {
  return typeof transformFn === "function" ? transformFn(data) : transformFn;
}

export class HTTPResponseBuilder {
  #response = new HTTPResponse();

  static create() {
    return new HTTPResponseBuilder();
  }

  derive() {
    return HTTPResponseBuilder.create()
      .data(this.#response.data)
      .headers(this.#response.headers)
      .request(this.#response.request)
      .status(this.#response.status)
      .statusText(this.#response.statusText);
  }

  status(code: StatusCode) {
    this.#response.status = code;
    return this;
  }

  statusText(text: string) {
    this.#response.statusText = text;
    return this;
  }

  data<T>(data: T) {
    this.#response.data = data;
    return this;
  }

  headers(dict: Record<string, string>) {
    this.#response.headers = dict;
    return this;
  }

  header(name: string, value: string) {
    this.#response.headers[name] = value;
    return this;
  }

  request(request: HTTPRequest<unknown>) {
    this.#response.request = request;
    return this;
  }

  build() {
    return this.#response;
  }
}
