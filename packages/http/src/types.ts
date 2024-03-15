import type { StatusCodes } from "@autometa/status-codes";
import type { HTTPResponse } from "./http.response";
import type { HTTPRequest } from "./http.request";
export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "TRACE"
  | "CONNECT"
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | "trace"
  | "connect";

export type HTTPAdditionalOptions<T> = {
  [P in keyof T]: T[P];
};
export type SchemaParser =
  | { parse: (data: unknown) => unknown }
  | { validate: (data: unknown) => unknown }
  | ((data: unknown) => unknown);

export type StatusCode<T extends typeof StatusCodes = typeof StatusCodes> = {
  [P in keyof T]: T[P] extends { status: infer U } ? U : never;
}[keyof T];

export type RequestHook = <T = unknown>(state: HTTPRequest<T>) => unknown;
export type ResponseHook<T> = (state: HTTPResponse<T>) => unknown;
