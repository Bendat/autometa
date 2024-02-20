import { HTTPRequest } from "./http-request";
import { HTTPResponse, HTTPResponseBuilder } from "./http-response";
import { HTTPAdditionalOptions, StatusCode } from "./types";
import axios, { AxiosRequestConfig } from "axios";
import { HTTPClient } from "./http-client";

@HTTPClient.Use()
export class AxiosClient extends HTTPClient {
  async request<TRequestType, TResponseType>(
    request: HTTPRequest<TRequestType>,
    options: HTTPAdditionalOptions<AxiosRequestConfig>
  ): Promise<HTTPResponse<TResponseType>> {
    const { baseUrl, route, params, headers, method, data } = request;
    const url = [baseUrl, ...route].join("/");
    const axiosRequest: AxiosRequestConfig = {
      url,
      params,
      headers,
      method,
      data,
      validateStatus: function (status) {
        return status >= 0 && status < 600;
      },
      ...options
    };
    const response = await axios(axiosRequest);
    return HTTPResponseBuilder.create()
      .status(response.status as StatusCode)
      .statusText(response.statusText)
      .data(response.data)
      .headers(response.headers as Record<string, string>)
      .request(request)
      .build() as HTTPResponse<TResponseType>;
  }
}
