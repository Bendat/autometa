import { Fixture, LIFE_CYCLE } from "@autometa/app";
import { AutomationError } from "@autometa/errors";
import axios, { Axios, AxiosResponse, Method, ResponseType } from "axios";
import { plainToClass } from "class-transformer";
import urlJoin from "url-join";
import { HTTPResponse } from "./http.response";
export type RequestState = {
  headers: Map<string, string>;
  params: Map<string, string>;
  url: string;
  route: string[];
  responseType: ResponseType | undefined;
  data: unknown;
};

export type RequestHook = (state: RequestState) => unknown;
export type ResponseHook<T> = (state: T) => unknown;

@Fixture(LIFE_CYCLE.Transient)
export class HTTPRequestBuilder {
  #headers = new Map<string, string>();
  #params = new Map<string, string>();
  #url: string;
  #route: string[] = [];
  #responseType: ResponseType | undefined = "json";
  #data: unknown;
  #onBeforeSend: RequestHook[] = [];
  #onAfterSend: ResponseHook<unknown>[] = [];
  get currentState(): RequestState {
    return {
      headers: this.#headers,
      params: this.#params,
      url: this.#url,
      route: this.#route,
      responseType: this.#responseType,
      data: this.#data
    };
  }

  get currentUrl() {
    return urlJoin(this.#url, ...this.#route);
  }
  url(url: string) {
    this.#url = url;
    return this;
  }

  onBeforeSend(hook: RequestHook) {
    this.#onBeforeSend.push(hook);
    return this;
  }

  onReceiveResponse(hook: ResponseHook<unknown>) {
    this.#onAfterSend.push(hook);
    return this;
  }

  route(...route: string[]) {
    this.#route.push(...route);
    return this;
  }

  header(name: string, value: string) {
    this.#headers.set(name, value);
    return this;
  }

  headers(dict: Record<string, string>) {
    Object.entries(dict).forEach(([name, value]) =>
      this.#headers.set(name, value)
    );
    return this;
  }

  param(name: string, value: string) {
    this.#params.set(name, value);
    return this;
  }

  params(dict: Record<string, string>) {
    Object.entries(dict).forEach(([name, value]) =>
      this.#params.set(name, value)
    );
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
    const url = this.currentUrl;
    const params = this.#params && Object.fromEntries(this.#params);
    const headers = this.#headers && Object.fromEntries(this.#headers);
    const responseType = this.#responseType;
    const data = this.#data;
    try {
      this.tryRunBeforeHooks<T>();
      const response = await axios({
        method,
        url,
        headers,
        params,
        data,
        responseType,
        validateStatus: function (status) {
          return status >= 100 && status < 500;
        }
      });
      const instance = makeResponse<T>(response);
      this.tryRunAfterHooks<T>(instance);
      return instance;
    } catch (e) {
      const error = e as Error;
      const message = `HTTP Client failed while while making request to ${url} with:
* headers: ${JSON.stringify(headers, null, 2)}

* data: ${data && JSON.stringify(data, null, 2)}`;
      throw new AutomationError(message, { cause: error });
    } finally {
      this.#headers.clear();
      this.#params.clear();
      this.#route = [];
      this.#url = "";
      this.#responseType = undefined;
      this.#data = undefined;
    }
  }

  private tryRunBeforeHooks<T>() {
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
}

function makeResponse<T>(res: AxiosResponse) {
  return plainToClass(HTTPResponse<T>, res);
}
