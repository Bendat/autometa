import { describe, expect, it, vi } from "vitest";
import { HTTP } from "../http";
import type { HTTPRequest } from "../http-request";
import type { HTTPTransport, HTTPTransportResponse } from "../transport";
import type { HTTPAdditionalOptions, StatusCode } from "../types";
import type { HTTPPlugin } from "../plugins";

describe("HTTP timeouts", () => {
  it("aborts the request when the timeout duration elapses", async () => {
    vi.useFakeTimers();
    try {
      const transport: HTTPTransport = {
        async send<TRequest, TResponse>(
          _request: HTTPRequest<TRequest>,
          options: HTTPAdditionalOptions<Record<string, unknown>>
        ): Promise<HTTPTransportResponse<TResponse>> {
          const signal = options["signal"] as AbortSignal | undefined;

          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              resolve({
                status: 200 as StatusCode,
                statusText: "OK",
                headers: {},
                data: undefined as unknown as TResponse,
              });
            }, 50);

            if (signal) {
              const onAbort = () => {
                clearTimeout(timer);
                reject((signal.reason as unknown) ?? new Error("Aborted"));
              };
              signal.addEventListener("abort", onAbort, { once: true });
            }
          });
        },
      };

      const client = HTTP.create({ transport })
        .url("https://example.com")
        .timeout(10);

      const pending = client.get();
      const captured = pending.catch((error) => error as unknown);
      await vi.advanceTimersByTimeAsync(15);

      const caught = await captured;

      expect(caught).toMatchObject({
        name: "HTTPTransportError",
        originalError: expect.objectContaining({
          name: "AbortError",
          message: "Request timed out after 10 ms",
        }),
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("merges provided signals with the timeout signal", async () => {
    const abortController = new AbortController();
    const capturedSignals: AbortSignal[] = [];

    const transport: HTTPTransport = {
      async send<TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> {
        const signal = options["signal"] as AbortSignal | undefined;

        return new Promise((_, reject) => {
          if (!signal) {
            reject(new Error("Missing signal"));
            return;
          }

          const onAbort = () => {
            reject((signal.reason as unknown) ?? new Error("Aborted"));
          };

          signal.addEventListener("abort", onAbort, { once: true });
        });
      },
    };

    const plugin: HTTPPlugin = {
      async onRequest(ctx) {
        const signal = ctx.options.signal as AbortSignal | undefined;
        if (signal) {
          capturedSignals.push(signal);
        }
      },
    };

    const client = HTTP.create({ transport, plugins: [plugin] })
      .url("https://example.com")
      .timeout(100);

  const abortReason = new Error("Manual abort");
  const pending = client.get({ signal: abortController.signal });
  await new Promise((resolve) => setTimeout(resolve, 0));
    abortController.abort(abortReason);

    await expect(pending).rejects.toMatchObject({
      name: "HTTPTransportError",
      originalError: abortReason,
    });

    expect(capturedSignals).toHaveLength(1);
    expect(capturedSignals[0]).toBeDefined();
    expect(capturedSignals[0]).not.toBe(abortController.signal);
  });
});
