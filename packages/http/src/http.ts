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
  HTTPRetryOptions,
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

export class HTTPServerError extends HTTPError {
  constructor(request: HTTPRequest<unknown>, response: HTTPResponse<unknown>) {
    super(`Server responded with status ${response.status}`, request, response);
    this.name = "HTTPServerError";
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
  private static sharedPlugins: HTTPPlugin[] = [];
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
    const plugins = [...HTTP.sharedPlugins, ...(options.plugins ?? [])];
    return new HTTP(
      transport,
      HTTPRequestBuilder.create(),
      new MetaConfigBuilder(),
      plugins,
      []
    );
  }

  /**
   * Registers a plugin applied to every client created via {@link HTTP.create}.
   */
  static registerSharedPlugin(plugin: HTTPPlugin): void {
    this.sharedPlugins = [...this.sharedPlugins, plugin];
  }

  /**
   * Replaces the shared plugin registry used by {@link HTTP.create}.
   */
  static setSharedPlugins(plugins: readonly HTTPPlugin[]): void {
    this.sharedPlugins = [...plugins];
  }

  /**
   * Returns a copy of the currently registered shared plugins.
   */
  static getSharedPlugins(): readonly HTTPPlugin[] {
    return [...this.sharedPlugins];
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
   * Configures automatic retries for this instance and all derived clients.
   */
  sharedRetry(options: HTTPRetryOptions | null) {
    this.meta.retry(options);
    return this;
  }

  /**
   * Returns a derived client with custom retry behaviour.
   */
  retry(options: HTTPRetryOptions | null) {
    return this.derive(({ meta }) => {
      meta.retry(options);
    });
  }

  /**
   * Forces subsequent requests to return raw response streams without parsing.
   */
  sharedStreamResponse(enabled: boolean) {
    this.meta.streamResponse(enabled);
    return this;
  }

  /**
   * Returns a derived client configured for streaming responses.
   */
  streamResponse(enabled: boolean) {
    return this.derive(({ meta }) => {
      meta.streamResponse(enabled);
    });
  }

  /**
   * Convenience helper that returns a clone configured for streaming responses.
   */
  asStream() {
    return this.streamResponse(true);
  }

  /**
   * Executes a GET request while preserving the raw response stream.
   */
  stream<TResponse>(options?: HTTPAdditionalOptions<unknown>) {
    return this.streamResponse(true).get<TResponse>(options);
  }

  /**
   * Sets a shared timeout (in milliseconds) applied to every request from this instance.
   */
  sharedTimeout(duration: number | null) {
    this.meta.timeout(duration);
    return this;
  }

  /**
   * Returns a derived client with a per-request timeout in milliseconds.
   */
  timeout(duration: number | null) {
    return this.derive(({ meta }) => {
      meta.timeout(duration);
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
   * Executes a request using the provided method.
   *
   * Use this when the verb is dynamic (e.g. provided by a parameter). It
   * behaves like calling {@link get}/{@link post}/{@link patch}, respecting any
   * route/headers/body configured earlier in the chain.
   */
  fetchWith<TResponse>(method: HTTPMethod | Lowercase<HTTPMethod>, options?: HTTPAdditionalOptions<unknown>) {
    const normalized = String(method).trim().toUpperCase() as HTTPMethod;
    return this.execute<TResponse>(normalized, options);
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
    const baseBuilder = this.builder.clone().method(method);
    const meta = this.meta.derive().build();
    const baseOptions = mergeOptions(meta.options, options);
    if (meta.streamResponse) {
      (baseOptions as Record<string, unknown>).streamResponse = true;
    }
    const retryPolicy = meta.retry;
    const maxRetries = retryPolicy?.attempts ?? 0;

    for (let retriesUsed = 0; ; ) {
      const attemptBuilder = baseBuilder.clone();
      await attemptBuilder.resolveDynamicHeaders();
      const request = attemptBuilder.build();
      request.method = method;

      const attemptOptions = {
        ...baseOptions,
      } as HTTPAdditionalOptions<unknown> & { signal?: AbortSignal };

      let timeoutController: AbortController | undefined;
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      let combinedSignal: CombinedAbortSignal | undefined;

      if (typeof meta.timeoutMs === "number" && meta.timeoutMs > 0) {
        const setup = createTimeoutController(meta.timeoutMs);
        timeoutController = setup.controller;
        timeoutHandle = setup.timer;
      }

      const existingSignal = attemptOptions.signal;
      const signals: AbortSignal[] = [];
      if (existingSignal) {
        signals.push(existingSignal);
      }
      if (timeoutController) {
        signals.push(timeoutController.signal);
      }

      if (signals.length === 1) {
        const singleSignal = signals[0];
        if (singleSignal) {
          attemptOptions.signal = singleSignal;
        } else if ("signal" in attemptOptions) {
          delete attemptOptions.signal;
        }
      } else if (signals.length > 1) {
        combinedSignal = combineAbortSignals(signals);
        attemptOptions.signal = combinedSignal.signal;
      } else if ("signal" in attemptOptions) {
        delete attemptOptions.signal;
      }

      const activeSignal = attemptOptions.signal;
      if (activeSignal?.aborted) {
        const reason = (activeSignal.reason as unknown) ?? createAbortError();
        throw new HTTPTransportError(request, reason);
      }

      const requestContext: HTTPRequestContext = {
        request,
        options: attemptOptions,
      };

      let response: HTTPResponse<unknown> | undefined;

      try {
        await this.runRequestPlugins(requestContext);
        await this.runOnSendHooks(meta, request);
        const raw = await this.transport
          .send(request, attemptOptions)
          .catch((cause) => {
            throw new HTTPTransportError(request, cause);
          });

        response = this.buildResponse(raw, request);
        const isStreaming = meta.streamResponse;
        if (!isStreaming) {
          response.data = transformResponse(meta.allowPlainText, response.data);
        }

        if (meta.throwOnServerError && response.status >= 500) {
          throw new HTTPServerError(request, response);
        }

        await this.runOnReceiveHooks(meta, response);

        let validated: HTTPResponse<TResponse>;
        if (meta.streamResponse) {
          validated = response as HTTPResponse<TResponse>;
        } else {
          try {
            validated = this.validateResponse<TResponse>(response, meta);
          } catch (cause) {
            throw new HTTPSchemaValidationError(request, response, cause);
          }
        }

        await this.runResponsePlugins({
          request,
          response: validated,
          options: attemptOptions,
        });

        return validated;
      } catch (thrown) {
        const normalized = thrown instanceof HTTPError ? thrown : (thrown as unknown);
        const retryAttempt = retriesUsed + 1;
        const policy = retryPolicy;
        const canRetry =
          policy !== undefined &&
          retryAttempt <= maxRetries &&
          (await this.shouldRetryRequest(
            normalized,
            policy,
            retryAttempt,
            request
          ));

        if (!canRetry) {
          await this.runErrorPlugins({
            request,
            options: attemptOptions,
            error: normalized,
          });
          throw normalized;
        }

        retriesUsed += 1;
        await this.delayRetry(retryAttempt, policy);
      } finally {
        if (timeoutHandle !== undefined) {
          clearTimeout(timeoutHandle);
        }
        combinedSignal?.dispose();
      }
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

  private async shouldRetryRequest(
    error: unknown,
    policy: HTTPRetryOptions,
    attempt: number,
    request: HTTPRequest<unknown>
  ) {
    if (attempt > policy.attempts) {
      return false;
    }

    const response = error instanceof HTTPError ? error.response : undefined;

    if (policy.retryOn) {
      const retryContext = response
        ? { error, attempt, request, response }
        : { error, attempt, request };
      return await policy.retryOn(retryContext);
    }

    if (error instanceof HTTPTransportError) {
      return true;
    }

    if (response && response.status >= 500) {
      return true;
    }

    return false;
  }

  private async delayRetry(attempt: number, policy: HTTPRetryOptions) {
    const { delay } = policy;

    let duration: number | undefined;
    if (typeof delay === "function") {
      duration = await delay(attempt);
    } else if (typeof delay === "number") {
      duration = delay * attempt;
    } else {
      duration = attempt * 100;
    }

    if (!duration || duration <= 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, duration));
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

interface CombinedAbortSignal {
  signal: AbortSignal;
  dispose: () => void;
}

interface TimeoutSetup {
  controller: AbortController;
  timer: ReturnType<typeof setTimeout>;
}

function createTimeoutController(timeoutMs: number): TimeoutSetup {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(createAbortError(`Request timed out after ${timeoutMs} ms`));
  }, timeoutMs);
  maybeUnrefTimer(timer);
  return { controller, timer };
}

function combineAbortSignals(signals: AbortSignal[]): CombinedAbortSignal {
  const controller = new AbortController();

  const aborted = signals.find((signal) => signal.aborted);
  if (aborted) {
    controller.abort((aborted.reason as unknown) ?? createAbortError());
    return { signal: controller.signal, dispose: () => undefined };
  }

  const listeners: Array<{ signal: AbortSignal; listener: () => void }> = [];

  for (const signal of signals) {
    const listener = () => {
      controller.abort((signal.reason as unknown) ?? createAbortError());
    };
    signal.addEventListener("abort", listener, { once: true });
    listeners.push({ signal, listener });
  }

  const dispose = () => {
    for (const { signal, listener } of listeners) {
      signal.removeEventListener("abort", listener);
    }
  };

  controller.signal.addEventListener("abort", dispose, { once: true });

  return { signal: controller.signal, dispose };
}

function maybeUnrefTimer(timer: ReturnType<typeof setTimeout>) {
  if (typeof timer === "object" && timer !== null) {
    const maybeTimer = timer as { unref?: () => void };
    if (typeof maybeTimer.unref === "function") {
      maybeTimer.unref();
    }
  }
}

function createAbortError(message = "The operation was aborted.") {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}
