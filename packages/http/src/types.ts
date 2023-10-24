import type { StatusCodes } from "@autometa/status-codes";
import type { Method, ResponseType } from "axios";
import type { HTTPResponse } from "./http.response";

export type SchemaParser = { parse: (data: unknown) => unknown };
export type StatusCode<T extends typeof StatusCodes = typeof StatusCodes> = {
  [P in keyof T]: T[P] extends { status: infer U } ? U : never;
}[keyof T];

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
