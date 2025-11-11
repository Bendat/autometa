import type { HTTPRequest } from "./http-request";
import type { StatusCode } from "./types";

/**
 * Immutable view of a completed HTTP response produced by {@link HTTP}.
 *
 * Use {@link HTTPResponseBuilder} to clone or modify instances in a safe way.
 */
export class HTTPResponse<T = unknown> {
  /**
   * HTTP status code returned by the remote service.
   */
  status!: StatusCode;

  /**
   * Human-readable text accompanying {@link status}.
   */
  statusText = "";

  /**
   * Response payload after all transformations and schema validation.
   */
  data!: T;

  /**
   * Normalised response headers keyed by lowercase header names.
   */
  headers: Record<string, string> = {};

  /**
   * Original request that produced this response.
   */
  request!: HTTPRequest<unknown>;

  /**
   * Creates a shallow clone from an existing response instance.
   */
  static fromRaw<T>(response: HTTPResponse<T>) {
    const next = new HTTPResponse<T>();
    next.status = response.status;
    next.statusText = response.statusText;
    next.data = response.data;
    next.headers = { ...response.headers };
    next.request = response.request;
    return next;
  }

  mapData<K>(value: K): HTTPResponse<K>;
  mapData<K>(transform: (response: T) => K): HTTPResponse<K>;
  /**
   * Returns a new response with identical metadata but a transformed payload.
   *
   * @example
   * const productResponse = await http.route("products", 1).get<Product>()
   * const simplified = productResponse.mapData((product) => product.name)
   */
  mapData<K>(transform: K | ((response: T) => K)): HTTPResponse<K> {
    const nextValue =
      typeof transform === "function" ? (transform as (input: T) => K)(this.data) : transform;
    return new HTTPResponseBuilder()
      .status(this.status)
      .statusText(this.statusText)
      .headers(this.headers)
      .request(this.request)
      .data(nextValue)
      .build() as HTTPResponse<K>;
  }
}

/**
 * Fluent builder used by {@link HTTP} to create {@link HTTPResponse} instances.
 */
export class HTTPResponseBuilder {
  private response = new HTTPResponse();

  /**
   * Creates a new empty builder.
   */
  static create() {
    return new HTTPResponseBuilder();
  }

  /**
   * Produces a new builder seeded with the current response state.
   */
  derive() {
    return HTTPResponseBuilder.create()
      .status(this.response.status)
      .statusText(this.response.statusText)
      .headers({ ...this.response.headers })
      .request(this.response.request)
      .data(this.response.data);
  }

  /**
   * Sets the response status code.
   */
  status(code: StatusCode) {
    this.response.status = code;
    return this;
  }

  /**
   * Sets the textual status message.
   */
  statusText(text: string) {
    this.response.statusText = text;
    return this;
  }

  /**
   * Attaches the response payload.
   */
  data<T>(data: T) {
    this.response.data = data;
    return this;
  }

  /**
   * Replaces the entire headers collection.
   */
  headers(dict: Record<string, string>) {
    this.response.headers = { ...dict };
    return this;
  }

  /**
   * Sets or overrides a single response header.
   */
  header(name: string, value: string) {
    this.response.headers[name] = value;
    return this;
  }

  /**
   * References the originating request.
   */
  request(request: HTTPRequest<unknown>) {
    this.response.request = request;
    return this;
  }

  /**
   * Builds the immutable {@link HTTPResponse} instance.
   */
  build() {
    return this.response;
  }
}
