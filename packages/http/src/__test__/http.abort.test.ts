import { describe, expect, it } from "vitest";
import { HTTP } from "../http";
import type { HTTPRequest } from "../http-request";
import type { HTTPTransport, HTTPTransportResponse } from "../transport";
import type { HTTPAdditionalOptions, StatusCode } from "../types";

describe("HTTP abort signals", () => {
  it("passes per-request abort signals through transport options", async () => {
    const controller = new AbortController();

    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        const signal = options["signal"] as AbortSignal | undefined;
        expect(signal).toBe(controller.signal);
        controller.abort();
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: undefined as unknown as TResponse,
        };
      },
    };

    const client = HTTP.create({ transport }).url("https://example.com");

    const response = await client.get({ signal: controller.signal });
    expect(controller.signal.aborted).toBe(true);
    expect(response.status).toBe(200);
  });

  it("supports shared and scoped abort signals", async () => {
    const shared = new AbortController();
    const scoped = new AbortController();
    const signals: Array<AbortSignal | undefined> = [];

    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        signals.push(options["signal"] as AbortSignal | undefined);
        return {
          status: 204 as StatusCode,
          statusText: "No Content",
          headers: {},
          data: undefined as unknown as TResponse,
        };
      },
    };

    const base = HTTP.create({ transport })
      .url("https://example.com")
      .sharedAbortSignal(shared.signal);

    const derived = base.abortSignal(scoped.signal);

    await base.get();
    await derived.get();

    expect(signals).toHaveLength(2);
    expect(signals[0]).toBe(shared.signal);
    expect(signals[1]).toBe(scoped.signal);
  });

  it("combines timeout and user signal", async () => {
    const userController = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    let resolveTransport: () => void = () => undefined;
    const transportPromise = new Promise<void>((resolve) => {
      resolveTransport = resolve;
    });

    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        receivedSignal = options["signal"] as AbortSignal | undefined;
        await transportPromise; // Wait for manual signal
        if (receivedSignal?.aborted) {
          throw new Error("AbortError");
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
      .timeout(1000);

    const requestPromise = client.get({ signal: userController.signal });

    // Wait for transport to receive signal
    // We can't easily wait for "transport entered", but we can assume it happens quickly.
    // Better: use a small delay or poll? 
    // Or just wait a tick.
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(receivedSignal).toBeDefined();
    expect(receivedSignal).not.toBe(userController.signal); 
    
    // Abort while request is pending
    userController.abort();
    expect(receivedSignal?.aborted).toBe(true);

    if (resolveTransport) {
      resolveTransport();
    }
    await expect(requestPromise).rejects.toThrow("Failed to execute HTTP request");
  });

  it("handles pre-aborted signal in combination", async () => {
    const userController = new AbortController();
    userController.abort("pre-aborted");
    
    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
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
      .timeout(1000);

    await expect(client.get({ signal: userController.signal })).rejects.toThrow("Failed to execute HTTP request");
  });
});