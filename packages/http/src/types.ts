import type { HTTPRequest } from "./http-request";
import type { HTTPResponse } from "./http-response";

type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;

type IntRange<From extends number, To extends number> =
  | Exclude<Enumerate<To>, Enumerate<From>>
  | From;

export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS"
  | "TRACE"
  | "CONNECT";

export type HTTPAdditionalOptions<T = Record<string, unknown>> = Partial<T> &
  Record<string, unknown>;

export type SchemaParser =
  | { parse: (data: unknown) => unknown }
  | { validate: (data: unknown) => unknown }
  | ((data: unknown) => unknown);

export type StatusCode = IntRange<100, 600>;

export type RequestHook = <T = unknown>(state: HTTPRequest<T>) => unknown;
export type ResponseHook<T> = (state: HTTPResponse<T>) => unknown;

export interface HTTPRetryContext {
  error: unknown;
  attempt: number;
  request: HTTPRequest<unknown>;
  response?: HTTPResponse<unknown>;
}

export type HTTPRetryPredicate = (
  context: HTTPRetryContext
) => boolean | Promise<boolean>;

export interface HTTPRetryOptions {
  attempts: number;
  delay?: number | ((attempt: number) => number | Promise<number>);
  retryOn?: HTTPRetryPredicate;
}

export type QueryParamPrimitive = string | number | boolean | null | undefined;
export type QueryParamValue =
  | QueryParamPrimitive
  | QueryParamValue[]
  | { [key: string]: QueryParamValue };

export type QueryParamSerializer = (
  params: Record<string, QueryParamValue>
) => string;

export type QueryParamArrayFormat =
  | "repeat"
  | "brackets"
  | "indices"
  | "comma"
  | "json";

export type QueryParamObjectFormat = "brackets" | "dot" | "json";

export interface QueryParamSerializationOptions {
  arrayFormat?: QueryParamArrayFormat;
  objectFormat?: QueryParamObjectFormat;
  serializer?: QueryParamSerializer | null;
}
