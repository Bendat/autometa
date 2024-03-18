import { Constructor, HTTP, HTTPRequest, HTTPResponse } from "@autometa/runner";
import {} from "@autometa/runner";
import { Env } from "../app";
@Constructor(HTTP)
export abstract class BaseController {
  constructor(protected readonly http: HTTP) {
    this.http
      .url(Env.API_URL)
      .requireSchema(true)
      .sharedOnSend("log request", this.logRequest)
      .sharedOnReceive("log response", this.logResponse);
  }

  private logRequest(state: HTTPRequest) {
    const headers = JSON.stringify(state.headers);
    const data = JSON.stringify(state.data);
    const headerLength = Object.keys(state.headers).length > 0 ? 1 : 0;
    const headerString = headerLength ? `headers: ${headers}` : "";
    const dataString = data !== undefined ? `data: ${data}` : "";
    const messages = [
      `Sending ${state.method} request to ${state.fullUrl}`,
      headerString,
      dataString,
    ];
    console.log(messages.join("\n"));
  }

  private logResponse(response: HTTPResponse<unknown>) {
    const data = JSON.stringify(response.data);
    const url = response.request.baseUrl;
    const dataString = data === undefined ? `data: ${data}` : "";
    const message = [
      `Received ${response.status} response from ${url}`,
      " ",
      `statusText: ${response.statusText}`,
      dataString,
    ];
    console.log(message.join("\n"));
  }
}
