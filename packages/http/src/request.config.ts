import { HTTPMethod } from "./types";

export interface RequestBaseConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | string[] | Record<string, unknown>>;
  baseUrl?: string;
  route?: string[];
  method: HTTPMethod;

  fullUrl(): string;
}

export interface RequestData<T = unknown> {
  data: T;
}

export type RequestConfig<T> = RequestBaseConfig & RequestData<T>;

export type RequestConfigBasic = RequestConfig<Record<string, unknown>>;
