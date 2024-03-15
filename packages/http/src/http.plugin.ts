import { HTTPResponse } from "../dist";
import { HTTPRequest } from "./http.request";

export abstract class HTTPPlugin<TConfig extends object> {
    constructor(protected readonly config: TConfig) { }

    abstract onSendRequest<T>(request: HTTPRequest<T>): void | Promise<void>
    abstract onReceiveResponse<T>(response: HTTPResponse<T>): void | Promise<void>
}