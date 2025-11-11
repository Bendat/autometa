import { describe, expect, it } from "vitest";
import { HTTP } from "../http";
import { createLoggingPlugin, type HTTPLogEvent } from "../plugins";
import type { HTTPRequest } from "../http-request";
import type { HTTPTransport, HTTPTransportResponse } from "../transport";
import type { HTTPAdditionalOptions, StatusCode } from "../types";
import { HTTPTransportError } from "../http";

describe("HTTP logging plugin", () => {
  it("emits request and response events", async () => {
    const events: HTTPLogEvent[] = [];

    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: { ok: true } as unknown as TResponse,
        };
      },
    };

    const client = HTTP.create({
      transport,
      plugins: [
        createLoggingPlugin(async (event) => {
          events.push(event);
        }),
      ],
    }).url("https://example.com");

    await client.get();

    expect(events.map((event) => event.type)).toEqual(["request", "response"]);
    expect(events[0].request.fullUrl).toBe("https://example.com/");
    expect(events[1].type).toBe("response");
    expect((events[1] as Extract<HTTPLogEvent, { type: "response" }>).response.status).toBe(200);
  });

  it("emits error events", async () => {
    const events: HTTPLogEvent[] = [];

    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        throw new Error("failure");
      },
    };

    const client = HTTP.create({
      transport,
      plugins: [
        createLoggingPlugin(async (event) => {
          events.push(event);
        }),
      ],
    }).url("https://example.com");

    await expect(client.get()).rejects.toBeInstanceOf(HTTPTransportError);

    expect(events.map((event) => event.type)).toEqual(["request", "error"]);
    const errorEvent = events[1] as Extract<HTTPLogEvent, { type: "error" }>;
    expect(errorEvent.error).toBeInstanceOf(HTTPTransportError);
  });
});
