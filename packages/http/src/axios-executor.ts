import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { SchemaMap } from "./schema.map";
import type { RequestState, StatusCode } from "./types";
import { plainToInstance } from "class-transformer";
import { HTTPResponse } from "./http.response";
import { AutomationError } from "@autometa/errors";
type ExecutorState = {
  response: AxiosResponse<unknown>;
  validated: unknown;
  error: Error | undefined;
};
export class AxiosExecutor {
  #result: ExecutorState = {} as ExecutorState;
  constructor(
    private options: AxiosRequestConfig,
    private schemaMap: SchemaMap,
    private requestState: RequestState,
    private requireSchema: boolean
  ) {}

  get error() {
    return this.#result.error;
  }
  get requestSucceeded() {
    return this.#result.response !== undefined;
  }

  get validationFailed() {
    return this.#result.validated === undefined;
  }

  async tryRequest<T>() {
    try {
      this.#result.response = await axios<T>(this.options);
      this.tryValidate();
    } catch (e) {
      if (this.#result.error) {
        return;
      }
      const { method, fullUrl, data, headers } = this.requestState;
      const body = JSON.stringify(data, null, 2);
      const headersString = JSON.stringify(headers, null, 2);
      const message = `Failed to send request to ${method}:${fullUrl}.
headers:
${headersString}
       
body: 
${body}`;
      this.#result.error = new AutomationError(message, { cause: e as Error });
    }
  }

  async tryValidate() {
    const { status, data } = this.#result.response;
    const { method, fullUrl } = this.requestState;
    try {
      this.#result.validated = this.schemaMap.validate(
        status as StatusCode,
        data,
        this.requireSchema
      );
    } catch (e) {
      const error = e as Error;
      const message = `Failed to validate response from ${method}:${fullUrl}.
      
Provided body was:
${JSON.stringify(data, null, 2)}`;
      this.#result.error = new AutomationError(message, { cause: error });
    }
  }

  getValidatedResponse<T>() {
    const { status, statusText, headers } = this.#result.response;
    const { validated: data } = this.#result;
    const { fullUrl: url, method } = this.requestState;
    return plainToInstance(HTTPResponse, {
      status,
      statusText,
      headers,
      data,
      request: {
        url,
        method
      }
    }) as HTTPResponse<T>;
  }

  getResponse<T>() {
    const { status, statusText, headers, data } = this.#result.response;
    const { fullUrl: url, method } = this.requestState;
    return plainToInstance(
      HTTPResponse,
      {
        status,
        statusText,
        headers,
        data,
        request: {
          url,
          method
        }
      },
      { excludeExtraneousValues: true }
    ) as HTTPResponse<T>;
  }
}
