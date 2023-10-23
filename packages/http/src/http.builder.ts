import { Fixture, LIFE_CYCLE } from "@autometa/app";
import { AutomationError } from "@autometa/errors";
import axios, { AxiosResponse, Method, ResponseType } from "axios";
import { plainToClass } from "class-transformer";
import { urlJoinP } from "url-join-ts";
import { HTTPResponse } from "./http.response";
import { SchemaMap } from "./schema.map";
import { SchemaParser, StatusCode } from "./types";
import isJson from "@stdlib/assert-is-json";
import { highlight } from "cli-highlight";
export type RequestState = {
  headers: Map<string, string>;
  params: Map<string, unknown>;
  url: string;
  route: string[];
  responseType: ResponseType | undefined;
  data: unknown;
  method: Method;
  get fullUrl(): string;
};

export type RequestHook = (state: RequestState) => unknown;
export type ResponseHook<T> = (state: HTTPResponse<T>) => unknown;

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
      headers: this.#headers,
      params: this.#params,
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
  schema(parser: SchemaParser, ...codes: number[]): HTTPRequestBuilder;
  schema(
    parser: SchemaParser,
    ...range: { from: number; to: number }[]
  ): HTTPRequestBuilder;

  schema(
    parser: SchemaParser,
    ...args: (number | { from: number; to: number })[]
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.#schemaMap.register(parser, ...(args as any));
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

  private async _request<T>(method: Method) {
    this.#method = method;
    const url = this.currentUrl;
    const headers = this.#headers && Object.fromEntries(this.#headers);
    const responseType = this.#responseType;
    const data = this.#data;
    let response: AxiosResponse = undefined as unknown as AxiosResponse;
    let skipFailedAfterHooks = false;
    try {
      this.tryRunBeforeHooks();
      response = await axios({
        method,
        url,
        headers,
        data,
        responseType,
        validateStatus: function (status) {
          return status >= 100 && status < 500;
        },
        transformResponse: transformResponse.bind(null, this.#allowPlainText)
      });
      const instance = this.makeResponse<T>(response);

      skipFailedAfterHooks = true;
      this.tryRunAfterHooks<T>(instance);
      return instance;
    } catch (e) {
      if (response && !skipFailedAfterHooks) {
        const instance = this.createWrapper<T>(response);
        this.tryRunAfterHooks<T>(instance);
      }
      const error = e as Error;
      const message = `HTTP Client failed while while making request to ${url} with:
* headers: ${JSON.stringify(headers, null, 2)}

* data: ${data && JSON.stringify(data, null, 2)}`;
      throw new AutomationError(message, { cause: error });
    }
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
      const message = `HTTP Client encountered an error while running 'onBeforeRequest' hooks at index ${index}`;
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
      const message = `HTTP Client encountered an error while running 'onAfterRequest' hooks at index ${index}`;
      throw new AutomationError(message, { cause: error });
    }
  }
  makeResponse<T>(res: AxiosResponse) {
    const { status, data } = res;
    const parsed = this.validateSchemas<T>(status, data);
    return this.createWrapper<T>(res, parsed);
  }

  private createWrapper<T>(
    { status, statusText, headers, data }: AxiosResponse<T>,
    parsed?: T
  ) {
    const params = Object.fromEntries(this.#params);
    const url = urlJoinP(this.#url, this.#route, params);
    return plainToClass(HTTPResponse<T>, {
      status,
      statusText,
      headers,
      data: parsed ?? data,
      request: {
        url,
        validated: !!parsed
      }
    });
  }

  private validateSchemas<T>(status: number, data: T): T {
    return this.#schemaMap.validate<T>(
      status as StatusCode,
      data,
      this.#requireSchema
    );
  }
}

function transformResponse(allowPlainText: boolean, data: string) {
  if (isJson(data)) {
    return JSON.parse(data);
  }
  if (["true", "false"].includes(data)) {
    return JSON.parse(data);
  }
  if (/^\d*\.?\d+$/.test(data)) {
    return Number(data);
  }
  if (data === "" || data === undefined) {
    return undefined;
  }
  if (allowPlainText) {
    return data;
  }
  const response = highlight(data, { language: "html" });
  const message = [
    `HTTP Client received a response which could not be parsed as JSON, and plain text responses were not configured for this request, Instead the body was:`,
    " ",
    response
  ];
  throw new AutomationError(message.join("\n"));
}
