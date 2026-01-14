import { describe, expect, it } from "vitest";
import {
  HTTP,
  HTTPTransportError,
  HTTPSchemaValidationError,
} from "../http";
import type { HTTPRequest } from "../http-request";
import type { HTTPTransport, HTTPTransportResponse } from "../transport";
import type { HTTPAdditionalOptions, StatusCode } from "../types";

describe("HTTP error handling", () => {
  it("wraps transport failures with HTTPTransportError", async () => {
    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        throw new Error("network down");
      },
    };

    const client = HTTP.create({ transport }).url("https://example.com");

    const error = await client.get().catch((thrown) => thrown);

    expect(error).toBeInstanceOf(HTTPTransportError);
    const typed = error as HTTPTransportError;
  expect(typed.request.fullUrl).toBe("https://example.com/");
    expect(typed.response).toBeUndefined();
    expect(typed.originalError).toBeInstanceOf(Error);
    expect((typed.originalError as Error).message).toBe("network down");
  });

  it("wraps schema validation failures with HTTPSchemaValidationError", async () => {
    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: { foo: "bar" } as unknown as TResponse,
        };
      },
    };

    const client = HTTP.create({ transport })
      .url("https://example.com")
      .requireSchema(true)
      .sharedSchema(() => {
        throw new Error("schema mismatch");
      }, 200 as StatusCode);

    const error = await client.get().catch((thrown) => thrown);

    expect(error).toBeInstanceOf(HTTPSchemaValidationError);
    const typed = error as HTTPSchemaValidationError;
  expect(typed.request.fullUrl).toBe("https://example.com/");
    expect(typed.response).toBeDefined();
    expect(typed.response?.status).toBe(200);
    expect(typed.originalError).toBeInstanceOf(Error);
    expect((typed.originalError as Error).message).toBe("schema mismatch");
  });
});
