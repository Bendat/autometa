import { Fixture, LIFE_CYCLE } from "@autometa/app";
import { AutomationError } from "@autometa/errors";
import { AxiosRequestConfig, Method, ResponseType } from "axios";
import { urlJoinP } from "url-join-ts";
import { HTTPResponse } from "./http.response";
import { SchemaMap } from "./schema.map";
import {
  RequestHook,
  RequestState,
  ResponseHook,
  SchemaParser,
  StatusCode
} from "./types";
import { transformResponse } from "./transform-response";
import { AxiosExecutor } from "./axios-executor";

@Fixture(LIFE_CYCLE.Transient)
export class HTTPRequestBuilder {
  #headers = new Map<string, string>();
  #params = new Map<string, unknown>();
  #url: string;
  #route: string[] = [];
  #method: Method;
  #schemaMap = new SchemaMap();
  #responseType: ResponseType | undefined = "json";
  #data: unknown;
  #requireSchema = false;
  #allowPlainText = false;
  #onBeforeSend: RequestHook[] = [];
  #onAfterSend: ResponseHook<unknown>[] = [];
  constructor(map: SchemaMap) {
    this.#schemaMap = new SchemaMap().including(map);
  }
  requireSchema(value: boolean) {
    this.#requireSchema = value;
    return this;
  }
  get currentState(): RequestState {
    const fullUrl = this.currentUrl;
    return {
      headers: Object.fromEntries(this.#headers),
      params: Object.fromEntries(this.#params),
      url: this.#url,
      route: this.#route,
      responseType: this.#responseType,
      data: this.#data,
      method: this.#method,
      fullUrl
    };
  }

  get currentUrl() {
    const params = Object.fromEntries(this.#params);
    return urlJoinP(this.#url, this.#route, params);
  }

  url(url: string) {
    this.#url = url;
    return this;
  }

  allowPlainText(value: boolean) {
    this.#allowPlainText = value;
    return this;
  }

  schema(parser: SchemaParser, ...codes: StatusCode[]): HTTPRequestBuilder;
  schema(
    parser: SchemaParser,
    ...range: { from: StatusCode; to: StatusCode }[]
  ): HTTPRequestBuilder;

  schema(
    parser: SchemaParser,
    ...args: (StatusCode | { from: StatusCode; to: StatusCode })[]
  ) {
    this.#schemaMap.register(parser, ...args);
    return this;
  }

  onBeforeSend(...hook: RequestHook[]) {
    this.#onBeforeSend.push(...hook);
    return this;
  }

  onReceivedResponse(...hook: ResponseHook<unknown>[]) {
    this.#onAfterSend.push(...hook);
    return this;
  }

  route(...route: (string | number | boolean)[]) {
    this.#route.push(...route.map((it) => `${it}`));
    return this;
  }

  header<T>(name: string, value: T) {
    const val = Array.isArray(value) ? value.join(",") : `${value}`;
    this.#headers.set(name, val);
    return this;
  }

  headers(dict: Record<string, string>) {
    Object.entries(dict).forEach(([name, value]) =>
      this.#headers.set(name, value)
    );
    return this;
  }

  param<T>(name: string, value: T) {
    this.#params.set(name, value);
    return this;
  }

  params(dict: Record<string, unknown>) {
    Object.entries(dict).forEach(([name, value]) => this.param(name, value));
    return this;
  }

  data<T>(data: T) {
    this.#data = data;
    return this;
  }

  async post<TReturn>(): Promise<HTTPResponse<TReturn>> {
    return this._request("POST");
  }

  async get<TReturn>(): Promise<HTTPResponse<TReturn>> {
    return this._request("GET");
  }

  async delete<TReturn>(): Promise<HTTPResponse<TReturn>> {
    return this._request("DELETE");
  }

  async put<TReturn>(): Promise<HTTPResponse<TReturn>> {
    return this._request("PUT");
  }

  async patch<TReturn>(): Promise<HTTPResponse<TReturn>> {
    return this._request("PATCH");
  }
  private async _request<T>(method: Method) {
    this.#method = method;

    const options: AxiosRequestConfig = this.constructOptions<T>(method);
    this.tryRunBeforeHooks();
    const executor = new AxiosExecutor(
      options,
      this.#schemaMap,
      this.currentState,
      this.#requireSchema
    );
    await executor.tryRequest<T>();
    if (executor.requestSucceeded && !executor.validationFailed) {
      const response = executor.getValidatedResponse<T>();
      this.tryRunAfterHooks<T>(response);
      return response;
    }
    if (executor.requestSucceeded) {
      const response = executor.getResponse<T>();
      // this.tryOnValidationFailed(response);
      this.tryRunAfterHooks<T>(response);
    }
    throw executor.error;
  }

  private constructOptions<T>(method: string): AxiosRequestConfig<T> {
    const url = this.currentUrl;
    const headers = this.#headers && Object.fromEntries(this.#headers);
    const responseType = this.#responseType;
    const data = this.#data as T;
    return {
      method,
      url,
      headers,
      data,
      responseType,
      validateStatus: function (status) {
        return status >= 100 && status < 500;
      },
      transformResponse: transformResponse.bind(null, this.#allowPlainText)
    };
  }

  private tryRunBeforeHooks() {
    let index = 0;
    try {
      for (const hook of this.#onBeforeSend) {
        hook(this.currentState);
        index++;
      }
    } catch (e) {
      const error = e as Error;
      const message = `HTTP Client 'onBeforeRequest' experienced an error at listener count ${index}`;
      throw new AutomationError(message, { cause: error });
    }
  }
  private tryRunAfterHooks<T>(response: HTTPResponse<T>) {
    let index = 0;
    try {
      for (const hook of this.#onAfterSend) {
        hook(response);
        index++;
      }
    } catch (e) {
      const error = e as Error;
      const message = `HTTP Client 'onRequestReceived' experienced an error at listener count ${index}`;
      throw new AutomationError(message, { cause: error });
    }
  }
}
