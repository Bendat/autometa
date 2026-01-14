import type {
  HTTPMethod,
  QueryParamSerializationOptions,
  QueryParamValue,
  QueryParamPrimitive,
} from "./types";

export type HeaderPrimitive = string | number | boolean | null | undefined;
export type HeaderFactory =
  | (() => HeaderPrimitive | Promise<HeaderPrimitive>)
  | undefined;
export type ParamPrimitive = QueryParamPrimitive;
export type ParamDictionary = Record<string, ParamValue>;
export type ParamValue = QueryParamValue | undefined;

export interface RequestConfigBasic<T = unknown> {
  headers?: Record<string, string>;
  params?: Record<string, ParamValue>;
  baseUrl?: string;
  route?: string[];
  method?: HTTPMethod;
  data?: T;
  queryOptions?: QueryParamSerializationOptions;
}

/**
 * Represents the request payload sent via {@link HTTP} including URL, headers and metadata.
 */
export class HTTPRequest<T = unknown> {
  /**
   * Normalised header collection that will be sent with the request.
   */
  headers: Record<string, string> = {};
  params: Record<string, ParamValue> = {};
  baseUrl: string | undefined;
  route: string[] = [];
  method: HTTPMethod | undefined;
  data: T | undefined;
  queryOptions: QueryParamSerializationOptions = {};

  constructor(config?: RequestConfigBasic<T>) {
    if (config) {
      Object.assign(this, config);
      if (config.queryOptions) {
        this.queryOptions = { ...config.queryOptions };
      }
    }
  }

  /**
   * Full request URL derived from {@link baseUrl}, {@link route} and {@link params}.
   */
  get fullUrl() {
    return buildFullUrl(
      this.baseUrl,
      this.route,
      this.params,
      this.queryOptions
    );
  }

  /**
   * Creates a deep copy of an existing request instance.
   */
  static derive<T>(original: HTTPRequest<T>) {
    const request = new HTTPRequest<T>();
    request.headers = { ...original.headers };
    request.params = cloneParams(original.params);
    request.baseUrl = original.baseUrl;
    request.route = [...original.route];
    request.method = original.method;
    request.data = original.data;
    request.queryOptions = { ...original.queryOptions };
    return request;
  }
}

/**
 * Fluent utility used to construct {@link HTTPRequest} instances while keeping internal state safe.
 */
export class HTTPRequestBuilder<T extends HTTPRequest<unknown>> {
  private requestInstance: T;
  private dynamicHeaders = new Map<string, HeaderFactory>();
  private queryOptions: QueryParamSerializationOptions;

  constructor(request: T | (() => T) = () => new HTTPRequest() as T) {
    this.requestInstance =
      typeof request === "function" ? request() : request;
    this.queryOptions = { ...this.requestInstance.queryOptions };
  }

  /**
   * Initializes a new builder for the default {@link HTTPRequest} type.
   */
  static create<T extends HTTPRequest<unknown>>() {
    return new HTTPRequestBuilder<T>();
  }

  /**
   * Exposes the underlying request without defensive cloning.
   */
  get request() {
    return this.requestInstance;
  }

  /**
   * Resolves asynchronous header factories into concrete header values on demand.
   */
  async resolveDynamicHeaders(
    request: HTTPRequest = this.requestInstance as HTTPRequest
  ) {
    for (const [name, factory] of this.dynamicHeaders) {
      if (!factory) {
        continue;
      }
      try {
        const result = await factory();
        if (result === undefined || result === null) {
          delete request.headers[name];
          continue;
        }
        request.headers[name] = String(result);
      } catch (error) {
        const cause = error as Error;
        throw new Error(
          `Failed to resolve dynamic header "${name}": ${cause.message}`
        );
      }
    }
    return this;
  }

  /**
   * Sets the root URL (protocol, host and optional base path).
   */
  url(url: string) {
    this.requestInstance.baseUrl = url;
    return this;
  }

  /**
   * Appends one or more path segments to the current request route.
   */
  route(...segments: (string | number | boolean)[]) {
    const mapped = segments
      .map((segment) => String(segment))
      .filter((segment) => segment.length > 0);
    this.requestInstance.route.push(...mapped);
    return this;
  }

  /**
   * Adds or removes a query parameter value.
   */
  param(name: string, value: ParamValue) {
    if (value === undefined) {
      delete this.requestInstance.params[name];
      return this;
    }

    if (Array.isArray(value)) {
      const list = value.filter(
        (item): item is QueryParamValue => item !== undefined && item !== null
      );
      const existing = this.requestInstance.params[name];
      if (Array.isArray(existing)) {
        this.requestInstance.params[name] = [
          ...existing,
          ...list,
        ];
      } else {
        this.requestInstance.params[name] = list;
      }
      return this;
    }

    if (value && typeof value === "object") {
      const dictEntries = Object.entries(
        value as Record<string, QueryParamValue>
      ).reduce<Record<string, QueryParamValue>>((acc, [key, paramValue]) => {
        if (paramValue !== undefined) {
          acc[key] = paramValue;
        }
        return acc;
      }, {});
      const existing = this.requestInstance.params[name];
      if (isPlainObject(existing)) {
        this.requestInstance.params[name] = {
          ...(existing as Record<string, QueryParamValue>),
          ...dictEntries,
        } as QueryParamValue;
      } else {
        this.requestInstance.params[name] = dictEntries;
      }
      return this;
    }

    this.requestInstance.params[name] = value;
    return this;
  }

  /**
   * Merges a dictionary of query parameters into the request.
   */
  params(dict: Record<string, unknown>) {
    for (const [key, value] of Object.entries(dict)) {
      this.param(key, value as ParamValue);
    }
    return this;
  }

  queryFormat(options: QueryParamSerializationOptions) {
    if (options.arrayFormat !== undefined) {
      this.queryOptions.arrayFormat = options.arrayFormat;
    }
    if (options.objectFormat !== undefined) {
      this.queryOptions.objectFormat = options.objectFormat;
    }
    if (Object.prototype.hasOwnProperty.call(options, "serializer")) {
      const serializer = options.serializer ?? undefined;
      if (serializer) {
        this.queryOptions.serializer = serializer;
      } else {
        delete this.queryOptions.serializer;
      }
    }
    this.requestInstance.queryOptions = { ...this.queryOptions };
    return this;
  }

  /**
   * Sets the request body payload. Passing `undefined` removes the body.
   */
  data<K>(data: K | undefined) {
    if (data === undefined) {
      delete this.requestInstance.data;
      return this;
    }
    this.requestInstance.data = data;
    return this;
  }

  /**
   * Sets a single header using direct values or a lazy factory.
   */
  header(
    name: string,
    value:
      | HeaderPrimitive
      | HeaderPrimitive[]
      | (() => HeaderPrimitive | Promise<HeaderPrimitive>)
  ) {
    if (typeof value === "function") {
      this.dynamicHeaders.set(name, value);
      delete this.requestInstance.headers[name];
      return this;
    }

    this.dynamicHeaders.delete(name);

    if (value === undefined || value === null) {
      delete this.requestInstance.headers[name];
      return this;
    }

    if (Array.isArray(value)) {
      const filtered = value.filter(
        (item) => item !== undefined && item !== null
      );
      this.requestInstance.headers[name] = filtered.map(String).join(",");
      return this;
    }

    this.requestInstance.headers[name] = String(value);
    return this;
  }

  /**
   * Replaces or merges multiple headers in one call.
   */
  headers(dict: Record<string, HeaderPrimitive | HeaderPrimitive[]>) {
    for (const [key, value] of Object.entries(dict)) {
      this.header(key, value as HeaderPrimitive | HeaderPrimitive[]);
    }
    return this;
  }

  /**
   * Stores the HTTP verb ensuring consistent casing.
   */
  method(method: HTTPMethod) {
    this.requestInstance.method = method.toUpperCase() as HTTPMethod;
    return this;
  }

  /**
   * Returns a copy-on-write builder pointing at the same request state.
   */
  derive() {
    return this.clone();
  }

  /**
   * Produces a deep copy of the builder and the underlying request.
   */
  clone() {
    const request = HTTPRequest.derive(this.requestInstance) as T;
    const builder = new HTTPRequestBuilder<T>(request);
    builder.dynamicHeaders = new Map(this.dynamicHeaders);
    builder.queryOptions = { ...this.queryOptions };
    builder.requestInstance.queryOptions = { ...this.queryOptions };
    return builder;
  }

  /**
   * Returns the current request without resolving header factories.
   */
  build() {
    this.requestInstance.queryOptions = { ...this.queryOptions };
    return this.requestInstance as HTTPRequest<T>;
  }

  /**
   * Resolves lazy headers before returning the request.
   */
  async buildAsync() {
    await this.resolveDynamicHeaders();
    this.requestInstance.queryOptions = { ...this.queryOptions };
    return this.requestInstance as HTTPRequest<T>;
  }
}

function cloneParams(
  params: Record<string, ParamValue>
) {
  return Object.entries(params).reduce<
    Record<string, ParamValue>
  >((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = [...value] as ParamValue;
      return acc;
    }
    if (isPlainObject(value)) {
      acc[key] = { ...(value as Record<string, ParamValue>) };
      return acc;
    }
    acc[key] = value;
    return acc;
  }, {});
}

function buildFullUrl(
  baseUrl: string | undefined,
  route: string[],
  params: Record<string, ParamValue>,
  options?: QueryParamSerializationOptions
) {
  const pathSegments = route
    .map((segment) => String(segment))
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.replace(/^\/+|\/+$/g, ""));

  const query = buildQueryString(params, options);

  if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
    const url = new URL(baseUrl);
    if (pathSegments.length > 0) {
      const basePath = url.pathname.replace(/^\/+|\/+$/g, "");
      const combined = [basePath, ...pathSegments].filter(Boolean).join("/");
      url.pathname = `/${combined}`;
    }
    url.search = query ? `?${query}` : "";
    return url.toString();
  }

  const trimmedBase = (baseUrl ?? "").replace(/\/+$/g, "");
  const joinedPath = pathSegments.join("/");
  const path = [trimmedBase, joinedPath]
    .filter((segment) => segment && segment.length > 0)
    .join(trimmedBase && joinedPath ? "/" : "");

  if (!path && !query) {
    return "";
  }

  if (!path) {
    return query ? `?${query}` : "";
  }

  return query ? `${path}?${query}` : path;
}

function buildQueryString(
  params: Record<string, ParamValue>,
  options?: QueryParamSerializationOptions
) {
  if (!params || Object.keys(params).length === 0) {
    return "";
  }

  const serializer = options?.serializer ?? undefined;
  if (serializer) {
    return serializer(params);
  }

  const arrayFormat = options?.arrayFormat ?? "repeat";
  const objectFormat = options?.objectFormat ?? "brackets";
  const search = new URLSearchParams();
  const append = (key: string, value: unknown) => {
    if (value === undefined || value === null) {
      return;
    }
    search.append(key, String(value));
  };

  const encode = (key: string, value: ParamValue) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      const filtered = value.filter(
        (item) => item !== undefined && item !== null
      ) as ParamValue[];
      if (filtered.length === 0) {
        return;
      }
      switch (arrayFormat) {
        case "json": {
          append(key, JSON.stringify(filtered));
          return;
        }
        case "comma": {
          const joined = filtered.map((item) => String(item)).join(",");
          append(key, joined);
          return;
        }
        case "indices": {
          filtered.forEach((item, index) => {
            encode(`${key}[${index}]`, item);
          });
          return;
        }
        case "brackets": {
          filtered.forEach((item) => {
            encode(`${key}[]`, item);
          });
          return;
        }
        default: {
          filtered.forEach((item) => {
            encode(key, item);
          });
          return;
        }
      }
    }

    if (isPlainObject(value)) {
      if (objectFormat === "json") {
        append(key, JSON.stringify(value));
        return;
      }
      for (const [childKey, childValue] of Object.entries(
        value as Record<string, ParamValue>
      )) {
        const nextKey =
          objectFormat === "dot"
            ? `${key}.${childKey}`
            : `${key}[${childKey}]`;
        encode(nextKey, childValue);
      }
      return;
    }

    append(key, value);
  };

  for (const [key, value] of Object.entries(params)) {
    encode(key, value);
  }

  return search.toString();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
