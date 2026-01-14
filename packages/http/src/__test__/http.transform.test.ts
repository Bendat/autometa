import { describe, expect, it, vi } from "vitest";
import { HTTP } from "../http";
import type { HTTPRequest } from "../http-request";
import type { HTTPTransport, HTTPTransportResponse } from "../transport";
import type { HTTPAdditionalOptions, StatusCode } from "../types";

describe("HTTP transform", () => {
  const mockTransport: HTTPTransport = {
    send: vi.fn(async <TRequest, TResponse>(
      _request: HTTPRequest<TRequest>,
      _options: HTTPAdditionalOptions<Record<string, unknown>>
    ): Promise<HTTPTransportResponse<TResponse>> => {
      return {
        status: 200 as StatusCode,
        statusText: "OK",
        headers: {},
        data: JSON.stringify({ value: 42 }) as unknown as TResponse,
      };
    }),
  };

  it("applies schema before transform", async () => {
    const schema = {
      parse: (data: unknown) => ({ ...(data as { value: number }), validated: true }),
    };

    const client = HTTP.create({ transport: mockTransport })
      .url("https://example.com")
      .schema(schema, 200);

    const result = await client
      .transform((response) => ({
        status: response.status,
        value: response.data.value,
        validated: response.data.validated,
      }))
      .get();

    expect(result).toEqual({ status: 200, value: 42, validated: true });
  });
});
