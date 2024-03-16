import { HTTPRequest, HTTPResponse } from "@autometa/http";
import { HTTPPlugin } from "../../http/src/http.plugin";

export type SwaggerCoveragePluginConfig = {
  reportDir: string;
  ignorePathPrefixes?: string[];
  ignorePathMatches?: RegExp[];
};

export class SwaggerCoveragePlugin extends HTTPPlugin<SwaggerCoveragePlugin> {
  onSendRequest<T>(request: HTTPRequest<T>) {
    request;
    return;
  }
  onReceiveResponse<T>(response: HTTPResponse<T>) {
    response;
  }
}
