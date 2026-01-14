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

  it("retries on 500 status by default", async () => {
    let attempts = 0;
    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        attempts += 1;
        if (attempts === 1) {
          return {
            status: 500 as StatusCode,
            statusText: "Internal Server Error",
            headers: {},
            data: {} as TResponse,
          };
        }
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: { ok: true } as TResponse,
        };
      },
    };

    const client = HTTP.create({ transport })
      .url("https://example.com")
      .throwOnServerError(true)
      .retry({ attempts: 1, delay: 0 });

    const response = await client.get<{ ok: boolean }>();
    expect(response.status).toBe(200);
    expect(attempts).toBe(2);
  });

  it("uses default delay calculation", async () => {
    let attempts = 0;
    const start = Date.now();
    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("fail");
        }
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: {} as TResponse,
        };
      },
    };

    const client = HTTP.create({ transport })
      .url("https://example.com")
      .retry({ attempts: 1 }); // default delay is attempt * 100

    await client.get();
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(95); // Allow slight timing variance in CI
    expect(attempts).toBe(2);
  });

  it("uses numeric delay", async () => {
    let attempts = 0;
    const start = Date.now();
    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("fail");
        }
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: {} as TResponse,
        };
      },
    };

    const client = HTTP.create({ transport })
      .url("https://example.com")
      .retry({ attempts: 1, delay: 50 }); // 50 * attempt

    await client.get();
    const duration = Date.now() - start;
    // Allow a small jitter budget because timers on CI can fire a few ms early
    expect(duration).toBeGreaterThanOrEqual(45);
    expect(attempts).toBe(2);
  });

  it("stops retrying when attempts exhausted", async () => {
    let attempts = 0;
    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        attempts += 1;
        throw new Error("fail");
      },
    };

    const client = HTTP.create({ transport })
      .url("https://example.com")
      .retry({ attempts: 2, delay: 0 });

    await expect(client.get()).rejects.toThrow("Failed to execute HTTP request");
    expect(attempts).toBe(3); // Initial + 2 retries
  });
});
