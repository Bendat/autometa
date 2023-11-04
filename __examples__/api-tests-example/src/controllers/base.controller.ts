import { HTTP } from "@autometa/runner";
import { RequestState, HTTPResponse } from "@autometa/runner";
import { Env } from "../app";
export abstract class BaseController {
  constructor(protected readonly http: HTTP) {
    this.http
      .url(Env.API_URL)
      .requireSchema(true)
      .sharedOnBeforeSend(this.logRequest)
      .sharedOnReceiveResponse(this.logResponse);
  }

  private logRequest(state: RequestState) {
    const headers = JSON.stringify(state.headers);
    const data = JSON.stringify(state.data);
    const headerLength = Object.keys(state.headers).length > 0 ? 1 : 0;
    const headerString = headerLength ? `headers: ${headers}` : "";
    const dataString = data !== undefined ? `data: ${data}` : "";
    const messages = [
      `Sending ${state.method} request to ${state.fullUrl}`,
      headerString,
      dataString
    ];
    console.log(messages.join("\n"));
  }

  private logResponse(response: HTTPResponse<unknown>) {
    const data = JSON.stringify(response.data);
    const url = response.request.url;
    const dataString = data === undefined ? `data: ${data}` : "";
    const message = [
      `Received ${response.status} response from ${url}`,
      " ",
      `statusText: ${response.statusText}`,
      dataString
    ];
    console.log(message.join("\n"));
  }
}
