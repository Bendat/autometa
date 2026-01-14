import { describe, expect, it } from "vitest";
import { HTTP } from "../http";
import type { HTTPRequest } from "../http-request";
import type { HTTPTransport, HTTPTransportResponse } from "../transport";
import type { HTTPAdditionalOptions, StatusCode } from "../types";

describe("HTTP streaming", () => {
  it("skips response transformation when streaming", async () => {
    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        const streamFlag = options["streamResponse"] as boolean | undefined;
        expect(streamFlag).toBe(true);
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: '{"value":42}' as unknown as TResponse,
        };
      },
    };

    const client = HTTP.create({ transport }).url("https://example.com");

    const streamed = await client.asStream().get<string>();
    expect(streamed.data).toBe('{"value":42}');
  });

  it("parses JSON when streaming is not enabled", async () => {
    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: '{"value":42}' as unknown as TResponse,
        };
      },
    };

    const client = HTTP.create({ transport }).url("https://example.com");

    const parsed = await client.get<{ value: number }>();
    expect(parsed.data).toEqual({ value: 42 });
  });

  it("provides stream() convenience helper", async () => {
    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        const streamFlag = options["streamResponse"] as boolean | undefined;
        expect(streamFlag).toBe(true);
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: "stream-payload" as unknown as TResponse,
        };
      },
    };

    const client = HTTP.create({ transport }).url("https://example.com");

    const response = await client.stream<string>();
    expect(response.data).toBe("stream-payload");
  });
});
