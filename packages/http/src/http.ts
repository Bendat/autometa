import { AutomationError } from "@autometa/errors";
import { createFetchTransport } from "./fetch-transport";
import { HTTPRequest, HTTPRequestBuilder } from "./http-request";
import type { HeaderPrimitive, ParamValue } from "./http-request";
import { HTTPResponse, HTTPResponseBuilder } from "./http-response";
import { MetaConfig, MetaConfigBuilder } from "./request-meta.config";
import type {
  HTTPErrorContext,
  HTTPPlugin,
  HTTPRequestContext,
  HTTPResponseContext,
} from "./plugins";
import { transformResponse } from "./transform-response";
import type { HTTPTransport } from "./transport";
import type {
  HTTPAdditionalOptions,
  HTTPMethod,
  QueryParamSerializationOptions,
  RequestHook,
  ResponseHook,
  SchemaParser,
  StatusCode,
} from "./types";

export class HTTPError extends AutomationError {
  readonly request: HTTPRequest<unknown>;
  readonly response: HTTPResponse<unknown> | undefined;
  readonly originalError: unknown;

  constructor(
    message: string,
    request: HTTPRequest<unknown>,
    response?: HTTPResponse<unknown>,
    cause?: unknown
  ) {
    super(message, {
      cause: cause instanceof Error ? cause : undefined,
    });
    this.request = request;
    this.response = response;
    this.originalError = cause;
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class HTTPTransportError extends HTTPError {
  constructor(request: HTTPRequest<unknown>, cause: unknown) {
    super("Failed to execute HTTP request", request, undefined, cause);
    this.name = "HTTPTransportError";
  }
}

export class HTTPSchemaValidationError extends HTTPError {
  constructor(
    request: HTTPRequest<unknown>,
    response: HTTPResponse<unknown>,
    cause: unknown
  ) {
    super("Response schema validation failed", request, response, cause);
    this.name = "HTTPSchemaValidationError";
  }
}

/**
 * Optional configuration applied during {@link HTTP.create}.
 */
export interface HTTPCreateOptions {
  /**
   * Custom transport implementation overriding the default Fetch based transport.
   */
  transport?: HTTPTransport;
  /**
   * Plugins that will be registered on every derived client instance.
   */
  plugins?: HTTPPlugin[];
}

/**
 * Fluent HTTP client with pluggable transport, schema validation and hook support.
 */
export class HTTP {
  private transport: HTTPTransport;
  private builder: HTTPRequestBuilder<HTTPRequest<unknown>>;
  private meta: MetaConfigBuilder;
  private sharedPlugins: HTTPPlugin[];
  private scopedPlugins: HTTPPlugin[];

  private constructor(
    transport: HTTPTransport,
    builder: HTTPRequestBuilder<HTTPRequest<unknown>>,
    meta: MetaConfigBuilder,
    sharedPlugins: HTTPPlugin[],
    scopedPlugins: HTTPPlugin[]
  ) {
    this.transport = transport;
    this.builder = builder;
    this.meta = meta;
    this.sharedPlugins = sharedPlugins;
    this.scopedPlugins = scopedPlugins;
  }

  /**
   * Factory helper that prepares an {@link HTTP} instance with shared state.
   */
  static create(options: HTTPCreateOptions = {}) {
    const transport = options.transport ?? createFetchTransport();
    const plugins = [...(options.plugins ?? [])];
    return new HTTP(
      transport,
      HTTPRequestBuilder.create(),
      new MetaConfigBuilder(),
      plugins,
      []
    );
  }

  /**
   * Registers a plugin that runs for every request executed by this instance and its clones.
   */
  use(plugin: HTTPPlugin) {
    this.sharedPlugins.push(plugin);
    return this;
  }

  /**
   * Returns a scoped clone with an additional plugin applied only to that clone.
   */
  plugin(plugin: HTTPPlugin) {
    return this.derive(({ plugins }) => {
      plugins.push(plugin);
    });
  }

  /**
   * Mutates the current instance to use a different transport implementation.
   */
  useTransport(transport: HTTPTransport) {
    this.transport = transport;
    return this;
  }

  /**
   * Produces a new client with an alternate transport without changing the original instance.
   */
  withTransport(transport: HTTPTransport) {
    return this.derive(undefined, { transport });
  }

  /**
   * Sets the base URL shared by subsequent requests.
   */
  url(url: string) {
    this.builder.url(url);
    return this;
  }

  /**
   * Applies additional transport specific options to every request executed by this instance.
   */
  sharedOptions(options: HTTPAdditionalOptions<unknown>) {
    this.meta.options(options);
    return this;
  }

  /**
   * Returns a derived client with extra transport options applied only to that clone.
   */
  withOptions(options: HTTPAdditionalOptions<unknown>) {
    return this.derive(({ meta }) => {
      meta.options(options);
    });
  }

  /**
   * Registers an {@link AbortSignal} that will be forwarded to every request issued by this instance.
   */
  sharedAbortSignal(signal: AbortSignal | null) {
    this.meta.options({ signal: signal ?? undefined });
    return this;
  }

  /**
   * Returns a derived client configured with the provided {@link AbortSignal}.
   */
  abortSignal(signal: AbortSignal | null) {
    return this.derive(({ meta }) => {
      meta.options({ signal: signal ?? undefined });
    });
  }

  /**
   * Configures whether schema validation is required before resolving a response.
   */
  requireSchema(required: boolean) {
    this.meta.requireSchema(required);
    return this;
  }

  /**
   * Returns a clone with overridden plain text handling mode.
   */
  allowPlainText(allow: boolean) {
    return this.derive(({ meta }) => {
      meta.allowPlainText(allow);
    });
  }

  /**
   * Sets plain text handling for the current instance and all future requests.
   */
  sharedAllowPlainText(allow: boolean) {
    this.meta.allowPlainText(allow);
    return this;
  }

  /**
   * Adds path segments that will be included in every request.
   */
  sharedRoute(...segments: (string | number | boolean)[]) {
    this.builder.route(...segments);
    return this;
  }

  /**
   * Returns a clone with additional path segments.
   */
  route(...segments: (string | number | boolean)[]) {
    return this.derive(({ builder }) => {
      builder.route(...segments);
    });
  }

  /**
   * Applies query serialization preferences to all future requests originating from this instance.
   */
  sharedQueryFormat(options: QueryParamSerializationOptions) {
    this.builder.queryFormat(options);
    return this;
  }

  /**
   * Returns a derived client with custom query serialization that does not affect the source instance.
   */
  queryFormat(options: QueryParamSerializationOptions) {
    return this.derive(({ builder }) => {
      builder.queryFormat(options);
    });
  }

  /**
   * Registers schema validation for one or more status codes on the current instance.
   */
  sharedSchema(parser: SchemaParser, ...codes: StatusCode[]): HTTP;
  sharedSchema(
    parser: SchemaParser,
    ...ranges: { from: StatusCode; to: StatusCode }[]
  ): HTTP;
  sharedSchema(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ) {
    this.meta.schema(parser, ...(args as never[]));
    return this;
  }

  /**
   * Returns a clone with schema validation limited to the derived instance.
   */
  schema(parser: SchemaParser, ...codes: StatusCode[]): HTTP;
  schema(
    parser: SchemaParser,
    ...ranges: { from: StatusCode; to: StatusCode }[]
  ): HTTP;
  schema(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ) {
    return this.derive(({ meta }) => {
      meta.schema(parser, ...(args as never[]));
    });
  }

  /**
   * Sets a shared query parameter for all future requests.
   */
  sharedParam(name: string, value: Record<string, unknown>): HTTP;
  sharedParam(
    name: string,
    value: (string | number | boolean | null | undefined)[]
  ): HTTP;
  sharedParam(name: string, ...value: (string | number | boolean)[]): HTTP;
  sharedParam(name: string, value: unknown, ...rest: unknown[]) {
    this.builder.param(name, toParamValue(value, rest));
    return this;
  }

  /**
   * Derives a client with additional query parameters.
   */
  param(name: string, value: Record<string, unknown>): HTTP;
  param(
    name: string,
    value: (string | number | boolean | null | undefined)[]
  ): HTTP;
  param(name: string, ...value: (string | number | boolean)[]): HTTP;
  param(name: string, value: unknown, ...rest: unknown[]) {
    return this.derive(({ builder }) => {
      builder.param(name, toParamValue(value, rest));
    });
  }

  /**
   * Merges multiple shared query parameters into the instance.
   */
  sharedParams(dict: Record<string, unknown>) {
    this.builder.params(dict);
    return this;
  }

  /**
   * Derives a client with additional query parameters applied together.
   */
  params(dict: Record<string, unknown>) {
    return this.derive(({ builder }) => {
      builder.params(dict);
    });
  }

  /**
   * Sets a shared request body used by every request from this instance.
   */
  sharedData<T>(data: T | undefined) {
    this.builder.data(data);
    return this;
  }

  /**
   * Derives a client with a one-off request body.
   */
  data<T>(data: T | undefined) {
    return this.derive(({ builder }) => {
      builder.data(data);
    });
  }

  /**
   * Registers a header that will be resolved for every request on this instance.
   */
  sharedHeader(
    name: string,
    value:
      | string
      | number
      | boolean
      | null
      | (string | number | boolean)[]
      | (() => HeaderPrimitive | Promise<HeaderPrimitive>)
  ) {
    this.builder.header(name, value);
    return this;
  }

  /**
   * Returns a clone with a header applied only to the resulting client.
   */
  header(
    name: string,
    value:
      | string
      | number
      | boolean
      | null
      | (string | number | boolean)[]
      | (() => HeaderPrimitive | Promise<HeaderPrimitive>)
  ) {
    return this.derive(({ builder }) => {
      builder.header(name, value);
    });
  }

  /**
   * Registers multiple shared headers for every downstream request.
   */
  sharedHeaders(dict: Record<string, HeaderPrimitive | HeaderPrimitive[]>) {
    this.builder.headers(dict);
    return this;
  }

  /**
   * Returns a derived client with additional headers.
   */
  headers(dict: Record<string, HeaderPrimitive | HeaderPrimitive[]>) {
    return this.derive(({ builder }) => {
      builder.headers(dict);
    });
  }

  /**
   * Registers a request hook that runs before every execution on this instance.
   */
  sharedOnSend(description: string, hook: RequestHook) {
    this.meta.onBeforeSend(description, hook);
    return this;
  }

  /**
   * Returns a clone with a request hook used only for that clone.
   */
  onSend(description: string, hook: RequestHook) {
    return this.derive(({ meta }) => {
      meta.onBeforeSend(description, hook);
    });
  }

  /**
   * Registers a response hook executed after every transport response.
   */
  sharedOnReceive(description: string, hook: ResponseHook<unknown>) {
    this.meta.onReceiveResponse(description, hook);
    return this;
  }

  /**
   * Returns a derived client with a response hook limited to that client.
   */
  onReceive(description: string, hook: ResponseHook<unknown>) {
    return this.derive(({ meta }) => {
      meta.onReceiveResponse(description, hook);
    });
  }

  /**
   * Configures whether server errors (>=500) throw by default for every request.
   */
  sharedThrowOnServerError(value: boolean) {
    this.meta.throwOnServerError(value);
    return this;
  }

  /**
   * Returns a derived client with custom server error behaviour.
   */
  throwOnServerError(value: boolean) {
    return this.derive(({ meta }) => {
      meta.throwOnServerError(value);
    });
  }

  /**
   * Executes a GET request using the current configuration.
   */
  get<TResponse>(options?: HTTPAdditionalOptions<unknown>) {
    return this.execute<TResponse>("GET", options);
  }

  /**
   * Executes a POST request using the current configuration.
   */
  post<TResponse>(options?: HTTPAdditionalOptions<unknown>) {
    return this.execute<TResponse>("POST", options);
  }

  /**
   * Executes a PUT request using the current configuration.
   */
  put<TResponse>(options?: HTTPAdditionalOptions<unknown>) {
    return this.execute<TResponse>("PUT", options);
  }

  /**
   * Executes a PATCH request using the current configuration.
   */
  patch<TResponse>(options?: HTTPAdditionalOptions<unknown>) {
    return this.execute<TResponse>("PATCH", options);
  }

  /**
   * Executes a DELETE request using the current configuration.
   */
  delete<TResponse>(options?: HTTPAdditionalOptions<unknown>) {
    return this.execute<TResponse>("DELETE", options);
  }

  /**
   * Executes a HEAD request using the current configuration.
   */
  head<TResponse>(options?: HTTPAdditionalOptions<unknown>) {
    return this.execute<TResponse>("HEAD", options);
  }

  /**
   * Executes an OPTIONS request using the current configuration.
   */
  options<TResponse>(options?: HTTPAdditionalOptions<unknown>) {
    return this.execute<TResponse>("OPTIONS", options);
  }

  /**
   * Executes a TRACE request using the current configuration.
   */
  trace<TResponse>(options?: HTTPAdditionalOptions<unknown>) {
    return this.execute<TResponse>("TRACE", options);
  }

  /**
   * Executes a CONNECT request using the current configuration.
   */
  connect<TResponse>(options?: HTTPAdditionalOptions<unknown>) {
    return this.execute<TResponse>("CONNECT", options);
  }

  private async execute<TResponse>(
    method: HTTPMethod,
    options?: HTTPAdditionalOptions<unknown>
  ) {
    const builder = this.builder.clone().method(method);
    await builder.resolveDynamicHeaders();
    const request = builder.build();
    request.method = method;

    const meta = this.meta.derive().build();
    const mergedOptions = mergeOptions(meta.options, options);

    const requestContext: HTTPRequestContext = {
      request,
      options: mergedOptions,
    };

    let response: HTTPResponse<unknown> | undefined;

    try {
      await this.runRequestPlugins(requestContext);
      await this.runOnSendHooks(meta, request);
      const raw = await this.transport
        .send(request, mergedOptions)
        .catch((cause) => {
          throw new HTTPTransportError(request, cause);
        });

      response = this.buildResponse(raw, request);
      response.data = transformResponse(meta.allowPlainText, response.data);

      if (meta.throwOnServerError && response.status >= 500) {
        throw new AutomationError(`Server responded with status ${response.status}`);
      }

      await this.runOnReceiveHooks(meta, response);

      let validated: HTTPResponse<TResponse>;
      try {
        validated = this.validateResponse<TResponse>(response, meta);
      } catch (cause) {
        throw new HTTPSchemaValidationError(request, response, cause);
      }

      await this.runResponsePlugins({
        request,
        response: validated,
        options: mergedOptions,
      });

      return validated;
    } catch (thrown) {
      const normalized = thrown instanceof HTTPError ? thrown : (thrown as unknown);
      await this.runErrorPlugins({
        request,
        options: mergedOptions,
        error: normalized,
      });
      throw normalized;
    }
  }

  private async runRequestPlugins(context: HTTPRequestContext) {
    for (const plugin of this.plugins()) {
      if (plugin.onRequest) {
        await plugin.onRequest(context);
      }
    }
  }

  private async runResponsePlugins(context: HTTPResponseContext) {
    for (const plugin of this.plugins()) {
      if (plugin.onResponse) {
        await plugin.onResponse(context);
      }
    }
  }

  private async runErrorPlugins(context: HTTPErrorContext) {
    for (const plugin of this.plugins()) {
      if (plugin.onError) {
        await plugin.onError(context);
      }
    }
  }

  private async runOnSendHooks(
    meta: MetaConfig,
    request: HTTPRequest<unknown>
  ) {
    for (const [description, hook] of meta.onSend) {
      try {
        await hook(request);
      } catch (error) {
        throw new AutomationError(
          `An error occurred in onSend hook "${description}"`,
          { cause: error as Error }
        );
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
      } catch (error) {
        throw new AutomationError(
          `An error occurred in onReceive hook "${description}"`,
          { cause: error as Error }
        );
      }
    }
  }

  private validateResponse<T>(response: HTTPResponse<unknown>, meta: MetaConfig) {
    const validated = meta.schemas.validate(
      response.status as StatusCode,
      response.data,
      meta.requireSchema
    ) as T;
    response.data = validated;
    return response as HTTPResponse<T>;
  }

  private buildResponse<T>(
    raw: {
      status: StatusCode;
      statusText: string;
      headers: Record<string, string | string[]>;
      data: T;
    },
    request: HTTPRequest<unknown>
  ) {
    return HTTPResponseBuilder.create()
      .status(raw.status)
      .statusText(raw.statusText)
      .headers(normalizeHeaders(raw.headers))
      .data(raw.data)
      .request(request)
      .build();
  }

  private plugins() {
    return [...this.sharedPlugins, ...this.scopedPlugins];
  }

  private derive(
    mutate?: (state: {
      builder: HTTPRequestBuilder<HTTPRequest<unknown>>;
      meta: MetaConfigBuilder;
      plugins: HTTPPlugin[];
    }) => void,
    overrides?: { transport?: HTTPTransport }
  ) {
    const builder = this.builder.clone();
    const meta = this.meta.derive();
    const plugins = [...this.scopedPlugins];

    if (mutate) {
      mutate({ builder, meta, plugins });
    }

    return new HTTP(
      overrides?.transport ?? this.transport,
      builder,
      meta,
      this.sharedPlugins,
      plugins
    );
  }
}

function mergeOptions(
  base: HTTPAdditionalOptions<unknown>,
  overrides?: HTTPAdditionalOptions<unknown>
) {
  if (!overrides) {
    return { ...base } as HTTPAdditionalOptions<unknown>;
  }

  const merged = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete merged[key];
    } else {
      merged[key] = value;
    }
  }
  return merged as HTTPAdditionalOptions<unknown>;
}

function normalizeHeaders(headers: Record<string, string | string[]>) {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    next[key] = Array.isArray(value) ? value.join(",") : String(value);
  }
  return next;
}

function toParamValue(value: unknown, rest: unknown[]): ParamValue {
  if (rest.length > 0) {
    return [value, ...rest] as ParamValue;
  }
  return value as ParamValue;
}
