import { HTTPRequest } from "./http-request";
import { HTTPResponse } from "./http-response";
import { HTTPAdditionalOptions } from "./types";
import { Class } from "@autometa/types";
export let defaultClient: Class<HTTPClient>;
export abstract class HTTPClient {
  static Use(): (target: Class<HTTPClient>) => void;
  static Use(client?: Class<HTTPClient>) {
    if (client) {
      defaultClient = client;
    }
    return function (target: Class<HTTPClient>) {
      defaultClient = target;
    };
  }
  abstract request<TRequestType, TResponseType>(
    request: HTTPRequest<TRequestType>,
    options?: HTTPAdditionalOptions<unknown>
  ): Promise<HTTPResponse<TResponseType>>;
}
