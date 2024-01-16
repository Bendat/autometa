import { Fixture, INJECTION_SCOPE } from "@autometa/injection";
import { AxiosClient } from "./axios-client";
import { HTTPClient } from "./http-client";
import { defaultClientFactory } from "./default-client-factory";
import { HTTPRequest, HTTPRequestBuilder } from "./http-request";
import { HTTPResponse } from "./http-response";
import { MetaConfig, MetaConfigBuilder } from "./request-meta.config";
import {
  HTTPAdditionalOptions,
  RequestHook,
  ResponseHook,
  SchemaParser,
  StatusCode
} from "./types";
import { transformResponse } from "./transform-response";
import { AutomationError } from "@autometa/errors";

/**
 * The HTTP fixture allows requests to be built and sent to a server. In general,
 * there are 2 modes of operation:
 *
 * * Shared Chain: The shared chain is used to configure the client for all requests, such as
 * routes this instance will always be used. When a shared chain method is called, it returns
 * the same instance of HTTP which can be further chained to configure the client.
 * * Request Chain: The request chain is used to configure a single request, inheriting values
 * set by the shared chain. When called, a new HTTP client instance is created and inherits the values
 * set by it's parent.
 *
 * The 2 modes are intended to simplify configuring an object through an inheritance chain. For example,
 * assume we have an API with 2 controller routes, `/product` and `/seller`. We can set up a Base Client
 * which consumes the HTTP fixture and configures it with the base url of our API.
 *
 * Inheritors can further configure their HTTP instance's routes.
 *
 * ```ts
 * \@Constructor(HTTP)
 * export class BaseClient {
 *  constructor(protected readonly http: HTTP) {
 *    this.http.url("https://api.example.com");
 *   }
 * }
 *
 * export class ProductClient extends BaseClient {
 *  constructor(http: HTTP) {
 *   super(http);
 *   this.http.sharedRoute("product");
 *  }
 *  getProduct(id: number) {
 *   return this.http.route(id).get();
 * }
 *
 * export class SellerClient extends BaseClient {
 *  constructor(http: HTTP) {
 *   super(http);
 *   this.http.sharedRoute("seller");
 *  }
 *
 *  getSeller(id: number) {
 *    return this.http.route(id).get();
 *  }
 * }
 * ```
 *
 * 'Schemas' can also be configured. A Schema is a function or an object with a `parse` method, which
 * takes a response data payload and returns a validated object. Schemas are mapped to
 * HTTP Status Codes, and if configured to be required the request will fail if no schema is found
 * matching that code.
 *
 * Defining a schema function:
 *
 * ```
 * // user.schema.ts
 * export function UserSchema(data: unknown) {
 *   if(typeof data !== "object") {
 *    throw new Error("Expected an object");
 *   }
 *
 *   if(typeof data.name !== "string") {
 *    throw new Error("Expected a string");
 *   }
 *
 *  return data as { name: string };
 * }
 *
 * // user.controller.ts
 * \@Fixture(INJECTION_SCOPE.TRANSIENT)
 * export class UserController extends BaseController {
 *   constructor(private readonly http: HTTP) {
 *      super(http);
 *      this.http
 *          .sharedRoute("user")
 *          .sharedSchema(ErrorSchema, { from: 400, to: 499 });
 *   }
 *
 *   getUser(id: number) {
 *    return this.http.route(id).schema(UserSchema, 200).get();
 *    // or
 *    return this.http
 *               .route(id)
 *               .schema(UserSchema, { from: 200, to: 299 })
 *               .get();
 *    // or
 *    return this.http
 *               .route(id)
 *               .schema(UserSchema, 200, 201, 202)
 *               .get();
 *   }
 * }
 * ```
 *
 * Validation libraries which use a `.parse` or `.validation`,  method, such as Zod or MyZod, can also be used as schemas:
 *
 * ```ts
 * // user.schema.ts
 * import { z } from "myzod";
 *
 * export const UserSchema = z.object({
 *  name: z.string()
 * });
 *
 * // user.controller.ts
 * \@Fixture(INJECTION_SCOPE.TRANSIENT)
 * export class UserController extends BaseController {
 *  constructor(private readonly http: HTTP) {
 *   super(http);
 *   this.http
 *       .sharedRoute("user")
 *       .sharedSchema(ErrorSchema, { from: 400, to: 499 })
 *  }
 *
 *  getUser(id: number) {
 *   return this.http.route(id).schema(UserSchema, 200).get();
 *  }
 * }
 * ```
 */
@Fixture(INJECTION_SCOPE.TRANSIENT)
export class HTTP {
  #request: HTTPRequestBuilder<HTTPRequest<unknown>>;
  #metaConfig: MetaConfigBuilder;
  constructor(
    private readonly client: HTTPClient = defaultClientFactory(),
    builder: HTTPRequestBuilder<
      HTTPRequest<unknown>
    > = new HTTPRequestBuilder(),
    metaConfig: MetaConfigBuilder = new MetaConfigBuilder()
  ) {
    this.#request = builder;
    this.#metaConfig = metaConfig.derive();
  }

  static create(
    client: HTTPClient = new AxiosClient(),
    builder: HTTPRequestBuilder<
      HTTPRequest<unknown>
    > = new HTTPRequestBuilder(),
    metaConfig: MetaConfigBuilder = new MetaConfigBuilder()
  ) {
    return new HTTP(client, builder, metaConfig);
  }

  /**
   * Sets the base url of the request for this client, such as
   * `https://api.example.com`, and could include always-used routes like
   * the api version, such as `/v1` or `/api/v1` at the end.
   *
   * ```ts
   *
   * \@Fixture(INJECTION_SCOPE.TRANSIENT)
   * export abstract class BaseClient {
   *   constructor(protected readonly http: HTTP) {
   *      this.http.url("https://api.example.com");
   *   }
   * }
   * ```
   * @param url
   * @returns
   */
  url(url: string) {
    this.#request.url(url);
    return this;
  }

  /**
   * If set to true, all requests derived from this client will require a schema be defined
   * matching any response status code. If set to false, a schema will still be used for validation
   * if defined, or the unadulterated original body will be returned if no schema matches.
   *
   * @param required Whether or not a schema is required for all responses.
   * @returns This instance of HTTP.
   */
  requireSchema(required: boolean) {
    this.#metaConfig.requireSchema(required);
    return this;
  }

  /**
   * If set to true, all requests derived from this client will allow plain text
   * responses. If set to false, plain text responses will throw an serialization error.
   *
   * Useful when an endpoint returns a HTML or plain text response. If the plain text
   * is the value of `true` or `false`, or a number, it will be parsed into the
   * appropriate type.
   *
   * This method is a shared chain method, and will return the same instance of HTTP.
   *
   * @param allow Whether or not plain text responses are allowed.
   * @returns This instance of HTTP.
   */
  sharedAllowPlainText(allow: boolean) {
    this.#metaConfig.allowPlainText(allow);
    return this;
  }

  /**
   * If set to true, all requests derived from this client will allow plain text
   * responses. If set to false, plain text responses will throw an serialization error.
   *
   * Useful when an endpoint returns a HTML or plain text response. If the plain text
   * is the value of `true` or `false`, or a number, it will be parsed into the
   * appropriate type.
   *
   * This method is a request chain method, and will return a new instance of HTTP.
   *
   * @param allow Whether or not plain text responses are allowed.
   * @returns A new child instance of HTTP derived from this one.
   */
  allowPlainText(allow: boolean) {
    return HTTP.create(
      this.client,
      this.#request.derive(),
      this.#metaConfig.derive().allowPlainText(allow)
    );
  }

  /**
   * Attaches a route to the request, such as `/product` or `/user`. Subsequent calls
   * to this method will append the route to the existing route, such as `/product/1`.
   *
   * Numbers will be converted to strings automatically. Routes can be defined one
   * at a time or as a spread argument.
   *
   * ```ts
   * constructor(http: HTTP) {
   *   super(http);
   *   this.http.sharedRoute("user", id).get();
   * }
   *
   * // or
   *
   * constructor(http: HTTP) {
   *   super(http);
   *   this.http
   *       .sharedRoute("user")
   *       .sharedRoute(id)
   *       .get();
   * }
   * ```
   *
   * This method is a shared chain method, and will return the same instance of HTTP. All
   * child clients will inherit the routes defined by this method. Useful to configure
   * in the constructor body.
   *
   * @param route A route or spread list of routes to append to the request.
   * @returns This instance of HTTP.
   */
  sharedRoute(...route: (string | number | boolean)[]) {
    this.#request.route(...route.map((r) => r.toString()));
    return this;
  }

  /**
   * Attaches a route to the request, such as `/product` or `/user`. Subsequent calls
   * to this method will append the route to the existing route, such as `/product/1`.
   *
   * Numbers will be converted to strings automatically. Routes can be defined one
   * at a time or as a spread argument.
   *
   * ```ts
   * getUser(id: number) {
   *   return this.http.route("user", id).get();
   * }
   *
   * // or
   *
   * getUser(id: number) {
   *  return this.http
   *            .route("user")
   *            .route(id)
   *            .get();
   * }
   * ```
   *
   * This method is a request chain method, and will return a new instance of HTTP, inheriting
   * any routes previously defined and appending the new route. Useful to configure
   * in class methods as part of finalizing a request.
   *
   * @param route A route or spread list of routes to append to the request.
   * @returns A new child instance of HTTP derived from this one.
   */
  route(...route: (string | number | boolean)[]) {
    const mapped = route.map((r) => String(r));
    return HTTP.create(this.client, this.#request.derive().route(...mapped));
  }

  /**
   * Attaches a shared schema mapping for all requests by this client. Schemas are
   * mapped to HTTP Status Codes, and if configured to be required the request will fail
   * if no schema is found matching that code.
   *
   * The status code mapping can be defined as a single code, a range of codes, or a spread list.
   *
   * ```ts
   * \@Fixture(INJECTION_SCOPE.TRANSIENT)
   * export class UserController extends BaseController {
   *  constructor(private readonly http: HTTP) {
   *   super(http);
   *   this.http
   *       .sharedRoute("user")
   *       .sharedSchema(UserSchema, 200)
   *       .sharedSchema(EmptySchema, 201, 204)
   *       .sharedSchema(ErrorSchema, { from: 400, to: 499 });
   *  }
   * }
   * ```
   *
   * This method is a shared chain method, and will return the same instance of HTTP. All
   * child clients will inherit the schemas defined by this method. Useful to configure
   * in the constructor body.
   *
   * @param parser The schema parser to use for this mapping.
   * @param codes A single status code, a range of status codes, or a spread list of status codes.
   * @returns This instance of HTTP.
   */
  sharedSchema(parser: SchemaParser, ...codes: StatusCode[]): HTTP;
  sharedSchema(
    parser: SchemaParser,
    ...range: { from: StatusCode; to: StatusCode }[]
  ): HTTP;
  sharedSchema(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ): HTTP {
    this.#metaConfig.schema(parser, ...args);
    return this;
  }

  /**
   * Attaches a schema mapping for this request. Schemas are
   * mapped to HTTP Status Codes, and if configured to be required the request will fail
   * if no schema is found matching that code.
   *
   * The status code mapping can be defined as a single code, a range of codes, or a spread list.
   *
   * ```ts
   * \@Fixture(INJECTION_SCOPE.TRANSIENT)
   * export class UserController extends BaseController {
   *  constructor(private readonly http: HTTP) {
   *   super(http);
   *   this.http
   *       .sharedRoute("user")
   *       .schema(ErrorSchema, { from: 400, to: 499 });
   *  }
   *
   *  getUser(id: number) {
   *   return this.http.route(id).schema(UserSchema, 200).get();
   *  }
   *
   *  getUsers(...ids: number[]) {
   *    return this.http
   *               .route("users")
   *               .schema(UserSchema, { from: 200, to: 299 })
   *               .schema(UserSchema, 200)
   *               .get();
   * }
   * ```
   *
   * This method is a request chain method, and will return a new instance of HTTP, inheriting
   * any schemas previously defined and appending the new schema. Useful to configure
   * in class methods as part of finalizing a request.
   *
   * @param parser The schema parser to use for this mapping.
   * @param codes A single status code, a range of status codes, or a spread list of status codes.
   * @returns A new child instance of HTTP derived from this one.
   */
  schema(parser: SchemaParser, ...codes: StatusCode[]): HTTP;
  schema(
    parser: SchemaParser,
    ...range: { from: StatusCode; to: StatusCode }[]
  ): HTTP;
  schema(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ): HTTP {
    return HTTP.create(
      this.client,
      this.#request.derive(),
      this.#metaConfig.derive().schema(parser, ...args)
    );
  }

  /**
   * Attaches a shared query string parameter to all requests by this client. Query string
   * parameters are key-value pairs which are appended to the request url, such as
   * `https://api.example.com?name=John&age=30`.
   *
   * This method is a shared chain method, and will return the same instance of HTTP. All
   * child clients will inherit the query string parameters defined by this method. Useful to configure
   * in the constructor body.
   *
   * @param name The name of the query string parameter.
   * @param value The value of the query string parameter.
   * @returns This instance of HTTP.
   */
  sharedParam(name: string, value: Record<string, unknown>): HTTP;
  sharedParam(name: string, ...value: (string | number | boolean)[]): HTTP;
  sharedParam(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ): HTTP {
    this.#request.param(name, value);
    return this;
  }

  /**
   * `onSend` is a pre-request hook which will be executed in order of definition
   * immediately before the request is sent. This hook can be used to analyze or
   * log the request state.
   *
   * ```ts
   *
   * \@Fixture(INJECTION_SCOPE.TRANSIENT)
   * export class UserController extends BaseController {
   *  constructor(private readonly http: HTTP) {
   *     super(http);
   *     this.http
   *         .sharedRoute("user")
   *         .sharedOnSend("log request",
   *                       (request) => console.log(JSON.stringify(request, null, 2))
   *     );
   *  }
   * }
   * ```
   *
   * This method is a shared chain method, and will return the same instance of HTTP. All
   * child clients will inherit the onSend hooks defined by this method. Useful to configure
   * in the constructor body.
   *
   * @param description A description of the hook, used for debugging.
   * @param hook The hook to execute.
   * @returns This instance of HTTP.
   */
  sharedOnSend(description: string, hook: RequestHook) {
    this.#metaConfig.onBeforeSend(description, hook);
    return this;
  }

  /**
   * `onReceive` is a post-request hook which will be executed in order of definition
   * immediately after the response is received. This hook can be used to analyze or
   * log the response state.
   *
   * ```ts
   *
   * \@Fixture(INJECTION_SCOPE.TRANSIENT)
   * export class UserController extends BaseController {
   *  constructor(private readonly http: HTTP) {
   *     super(http);
   *     this.http
   *         .sharedRoute("user")
   *         .sharedOnReceive("log response",
   *                          (response) => console.log(JSON.stringify(response, null, 2))
   *     );
   *  }
   * }
   * ```
   *
   * This method is a shared chain method, and will return the same instance of HTTP. All
   * child clients will inherit the onReceive hooks defined by this method. Useful to configure
   * in the constructor body.
   *
   * @param description A description of the hook, used for debugging.
   * @param hook The hook to execute.
   * @returns This instance of HTTP.
   */
  sharedOnReceive(description: string, hook: ResponseHook<unknown>) {
    this.#metaConfig.onReceiveResponse(description, hook);
    return this;
  }

  /**
   * Attaches a query string parameter object to the request. Query string
   * parameters are key-value pairs which are appended to the request url, such as
   * `https://api.example.com?name=John&age=30`.
   *
   * This method is a shared chain method, and will return the same instance of HTTP. All
   * child clients will inherit the query string parameters defined by this method. Useful to configure
   * in the constructor body.
   *
   * ```ts
   * constructor(http: HTTP) {
   *    super(http);
   *    this.http
   *        .sharedParams({ 'is-test': "true" })
   * ```
   * @param name The name of the query string parameter.
   * @param value The value of the query string parameter.
   * @returns This instance of HTTP.
   */
  sharedParams(dict: Record<string, unknown>) {
    this.#request.params(dict);
    return this;
  }

  /**
   * Attaches a query string parameter to the request. Query string
   * parameters are key-value pairs which are appended to the request url, such as
   * `https://api.example.com?name=John&age=30`.
   *
   * This method is a request chain method, and will return a new instance of HTTP, inheriting
   * any query string parameters previously defined and appending the new parameter. Useful to configure
   * in class methods as part of finalizing a request.
   *
   * ```ts
   * getUser(id: number) {
   *   return this.http
   *             .route(id)
   *             .param("name", "John")
   *             .param("age", 30)
   * ```
   *
   * Note: Numbers and Booleans will be converted to strings automatically.
   *
   * @param name The name of the query string parameter.
   * @param value The value of the query string parameter.
   * @returns A new child instance of HTTP derived from this one.
   */
  param(name: string, value: Record<string, unknown>): HTTP;
  param(name: string, ...value: (string | number | boolean)[]): HTTP;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  param(name: string, value: any) {
    return HTTP.create(this.client, this.#request.derive().param(name, value));
  }

  /**
   * Attaches a query string parameter object to the request. Query string
   * parameters are key-value pairs which are appended to the request url, such as
   * `https://api.example.com?name=John&age=30`.
   *
   * This method is a shared chain method, and will return the same instance of HTTP. All
   * child clients will inherit the query string parameters defined by this method. Useful to configure
   * in the constructor body.
   *
   * ```ts
   * getUser(id: number) {
   *   return this.http
   *             .route(id)
   *             .param({ name: "John", age: "30" })
   *
   * @param name The name of the query string parameter.
   * @param value The value of the query string parameter.
   * @returns This instance of HTTP.
   */
  params(dict: Record<string, string>) {
    this.#request.params(dict);
    return HTTP.create(this.client, this.#request.derive().params(dict));
  }

  /**
   * Attaches a shared data payload to this client. The data payload is the body of the request,
   * and can be any type. If the data payload is an object, it will be serialized to JSON.
   *
   * This method is a shared chain method, and will return the same instance of HTTP. All
   * child clients will inherit the data payload defined by this method. Useful to configure
   * in the constructor body.
   *
   * @param data The data payload to attach to the request.
   * @returns This instance of HTTP.
   */
  sharedData<T>(data: T) {
    this.#request.data(data);
    return this;
  }

  /**
   * Attaches a shared header to this client. Headers are string:string key-value pairs which are
   * sent with the request, such as `Content-Type: application/json`.
   *
   * Numbers, Booleans and Null will be converted to string values automatically.
   *
   * A Factory function can also be provided to generate the header value at the time of request.
   *
   * This method is a shared chain method, and will return the same instance of HTTP. All
   * child clients will inherit the header defined by this method. Useful to configure
   * in the constructor body.
   *
   * @param name The name of the header.
   * @param value The value of the header.
   */
  sharedHeader(
    name: string,
    value:
      | string
      | number
      | boolean
      | null
      | (string | number | boolean)[]
      | (() => string | number | boolean | null)
      | (() => Promise<string | number | boolean | null>)
  ) {
    this.#request.header(name, value);
    return this;
  }

  header(
    name: string,
    value:
      | string
      | number
      | boolean
      | null
      | (string | number | boolean)[]
      | (() => string | number | boolean | null)
      | (() => Promise<string | number | boolean | null>)
  ) {
    return HTTP.create(this.client, this.#request.derive().header(name, value));
  }

  /**
   * Attaches a data payload to this request. The data payload is the body of the request,
   * and can be any type. If the data payload is an object, it will be serialized to JSON.
   *
   * This method is a request chain method, and will return a new instance of HTTP, inheriting
   * any data payload previously defined and appending the new payload. Useful to configure
   * in class methods as part of finalizing a request.
   *
   * @param data The data payload to attach to the request.
   * @returns A new child instance of HTTP derived from this one.
   */
  data<T>(data: T) {
    this.#request.data(data);
    return HTTP.create(this.client, this.#request.derive().data(data));
  }

  /**
   * `onSend` is a pre-request hook which will be executed in order of definition
   * immediately before the request is sent. This hook can be used to modify the request,
   * or to log the state of a request before final send-off.
   *
   * ```ts
   *
   * \@Fixture(INJECTION_SCOPE.TRANSIENT)
   * export class UserController extends BaseController {
   *  constructor(private readonly http: HTTP) {
   *   super(http);
   *  }
   *
   *  getUser(id: number) {
   *   return this.http
   *              .route(id)
   *              .onSend("log request",
   *                (request) => console.log(JSON.stringify(request, null, 2)
   *              )
   *              .get();
   * }
   * ```
   *
   * This method is a request chain method, and will return a new instance of HTTP, inheriting
   * any onSend hooks previously defined and appending the new hook. Useful to configure
   * in class methods as part of finalizing a request.
   *
   * @param description A description of the hook, used for debugging.
   * @param hook The hook to execute.
   * @returns A new child instance of HTTP derived from this one.
   */
  onSend(description: string, hook: RequestHook) {
    return HTTP.create(
      this.client,
      this.#request.derive(),
      this.#metaConfig.derive().onBeforeSend(description, hook)
    );
  }

  /**
   * `onReceive` is a post-request hook which will be executed in order of definition
   * immediately after the response is received. This hook can be used to modify the response,
   * or to log the state of a response after it is received.
   *
   * ```ts
   *
   * \@Fixture(INJECTION_SCOPE.TRANSIENT)
   * export class UserController extends BaseController {
   *  constructor(private readonly http: HTTP) {
   *   super(http);
   *  }
   *
   *  getUser(id: number) {
   *   return this.http
   *              .route(id)
   *              .onReceive("log response",
   *                (response) => console.log(JSON.stringify(response, null, 2)
   *              )
   *              .get();
   * }
   * ```
   *
   * This method is a request chain method, and will return a new instance of HTTP, inheriting
   * any onReceive hooks previously defined and appending the new hook. Useful to configure
   * in class methods as part of finalizing a request.
   *
   * @param description A description of the hook, used for debugging.
   * @param hook The hook to execute.
   * @returns A new child instance of HTTP derived from this one.
   */
  onReceive(description: string, hook: ResponseHook<unknown>) {
    return HTTP.create(
      this.client,
      this.#request.derive(),
      this.#metaConfig.derive().onReceiveResponse(description, hook)
    );
  }

  /**
   * Executes the current request state as a GET request.
   *
   * @param options Additional options to pass to the underlying http client, such
   *                as e.g Axios configuration values.
   * @returns A promise which resolves to the response.
   */
  get<TResponseType>(options?: HTTPAdditionalOptions<unknown>) {
    return this.#makeRequest(
      this.#request.derive().method("GET"),
      options
    ) as Promise<HTTPResponse<TResponseType>>;
  }

  /**
   * Executes the current request state as a POST request.
   *
   * @param data The data payload to attach to the request.
   * @param options Additional options to pass to the underlying http client, such
   *                as e.g Axios configuration values.
   * @returns A promise which resolves to the response.
   */
  post<TResponseType>(options?: HTTPAdditionalOptions<unknown>) {
    return this.#makeRequest(
      this.#request.derive().method("POST"),
      options
    ) as Promise<HTTPResponse<TResponseType>>;
  }

  /**
   * Executes the current request state as a DELETE request.
   *
   * @param options Additional options to pass to the underlying http client, such
   *                as e.g Axios configuration values.
   * @returns A promise which resolves to the response.
   *               as e.g Axios configuration values.
   */
  delete<TResponseType>(options?: HTTPAdditionalOptions<unknown>) {
    return this.#makeRequest(
      this.#request.derive().method("DELETE"),
      options
    ) as Promise<HTTPResponse<TResponseType>>;
  }

  /**
   * Executes the current request state as a PUT request.
   *
   * @param options Additional options to pass to the underlying http client, such
   *                as e.g Axios configuration values.
   * @returns A promise which resolves to the response.
   */
  put<TResponseType>(options?: HTTPAdditionalOptions<unknown>) {
    return this.#makeRequest(
      this.#request.derive().method("PUT"),
      options
    ) as Promise<HTTPResponse<TResponseType>>;
  }
  /**
   * Executes the current request state as a PATCH request.
   *
   * @param options Additional options to pass to the underlying http client, such
   *                as e.g Axios configuration values.
   * @returns A promise which resolves to the response.
   */
  patch<TResponseType>(options?: HTTPAdditionalOptions<unknown>) {
    return this.#makeRequest(
      this.#request.derive().method("PATCH"),
      options
    ) as Promise<HTTPResponse<TResponseType>>;
  }

  head<TResponseType>(options?: HTTPAdditionalOptions<unknown>) {
    return this.#makeRequest(
      this.#request.derive().method("HEAD"),
      options
    ) as Promise<HTTPResponse<TResponseType>>;
  }

  options<TResponseType>(options?: HTTPAdditionalOptions<unknown>) {
    return this.#makeRequest(
      this.#request.derive().method("OPTIONS"),
      options
    ) as Promise<HTTPResponse<TResponseType>>;
  }

  trace<TResponseType>(options?: HTTPAdditionalOptions<unknown>) {
    return this.#makeRequest(
      this.#request.derive().method("TRACE"),
      options
    ) as Promise<HTTPResponse<TResponseType>>;
  }

  connect<TResponseType>(options?: HTTPAdditionalOptions<unknown>) {
    return this.#makeRequest(
      this.#request.derive().method("CONNECT"),
      options
    ) as Promise<HTTPResponse<TResponseType>>;
  }

  async #makeRequest(
    builder: HTTPRequestBuilder<HTTPRequest<unknown>>,
    options?: HTTPAdditionalOptions<unknown>
  ) {
    const request = (await builder.resolveDynamicHeaders()).build();
    const meta = this.#metaConfig.derive().build();
    await this.runOnSendHooks(meta, request);
    const result = await this.client.request<unknown, string>(request, options);
    result.data = transformResponse(meta.allowPlainText, result.data);
    await this.runOnReceiveHooks(meta, result);
    const validated = this.#validateResponse(result, meta);
    return validated;
  }

  private async runOnSendHooks(
    meta: MetaConfig,
    request: HTTPRequest<unknown>
  ) {
    for (const [description, hook] of meta.onSend) {
      try {
        await hook(request);
      } catch (e) {
        const cause = e as Error;
        const msg = `An error occurred while sending a request in hook: '${description}'`;
        throw new AutomationError(msg, { cause });
      }
    }
  }
  private async runOnReceiveHooks(
    meta: MetaConfig,
    response: HTTPResponse<unknown>
  ) {
    for (const [description, hook] of meta.onReceive) {
      try {
        await hook(response);
      } catch (e) {
        const cause = e as Error;
        const msg = `An error occurred while receiving a response in hook: '${description}'`;
        throw new AutomationError(msg, { cause });
      }
    }
  }

  #validateResponse<T>(
    response: HTTPResponse<unknown>,
    meta: MetaConfig
  ): HTTPResponse<T> {
    const { status, data } = response;
    const validated = meta.schemas.validate(
      status,
      data,
      meta.requireSchema
    ) as T;
    response.data = validated;
    return response as HTTPResponse<T>;
  }
}
