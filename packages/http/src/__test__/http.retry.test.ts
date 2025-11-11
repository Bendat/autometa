import { describe, expect, it } from "vitest";
import { HTTP } from "../http";
import type { HTTPRequest } from "../http-request";
import type { HTTPTransport, HTTPTransportResponse } from "../transport";
import type { HTTPAdditionalOptions, HTTPRetryOptions, StatusCode } from "../types";
import { AutomationError } from "@autometa/errors";

describe("HTTP retries", () => {
  it("retries transport failures with the default predicate", async () => {
    let attempts = 0;

    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("temporary network error");
        }

        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: { ok: true } as unknown as TResponse,
        };
      },
    };

    const retryPolicy: HTTPRetryOptions = {
      attempts: 1,
      delay: () => 0,
    };

    const client = HTTP.create({ transport })
      .url("https://example.com")
      .retry(retryPolicy);

    const response = await client.get<{ ok: boolean }>();
    expect(response.status).toBe(200);
    expect(attempts).toBe(2);
  });

  it("accepts custom retry predicates", async () => {
    let attempts = 0;

    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        attempts += 1;
        if (attempts === 1) {
          return {
            status: 503 as StatusCode,
            statusText: "Service Unavailable",
            headers: {},
            data: "{}" as unknown as TResponse,
          };
        }

        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: { ok: true } as unknown as TResponse,
        };
      },
    };

    const retryPolicy: HTTPRetryOptions = {
      attempts: 1,
      delay: () => 0,
      retryOn: async ({ error }) => error instanceof AutomationError,
    };

    const client = HTTP.create({ transport })
      .url("https://example.com")
      .throwOnServerError(true)
      .retry(retryPolicy);

    const response = await client.get<{ ok: boolean }>();
    expect(response.status).toBe(200);
    expect(attempts).toBe(2);
  });
});
