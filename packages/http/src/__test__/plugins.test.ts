import { describe, expect, it, vi } from "vitest";
import { createLoggingPlugin } from "../plugins";
import { HTTPRequest } from "../http-request";
import { HTTPResponse } from "../http-response";

describe("createLoggingPlugin", () => {
  it("creates a plugin with correct name", () => {
    const sink = vi.fn();
    const plugin = createLoggingPlugin(sink);
    expect(plugin.name).toBe("http-logging");
  });

  it("logs request event", async () => {
    const sink = vi.fn();
    const plugin = createLoggingPlugin(sink);
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    const options = {};

    await plugin.onRequest?.({ request, options });

    expect(sink).toHaveBeenCalledWith(expect.objectContaining({
      type: "request",
      request,
      options,
      timestamp: expect.any(Number),
    }));
  });

  it("logs response event", async () => {
    const sink = vi.fn();
    const plugin = createLoggingPlugin(sink);
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    const response = new HTTPResponse();
    const options = {};

    await plugin.onResponse?.({ request, response, options });

    expect(sink).toHaveBeenCalledWith(expect.objectContaining({
      type: "response",
      request,
      response,
      options,
      timestamp: expect.any(Number),
    }));
  });

  it("logs error event", async () => {
    const sink = vi.fn();
    const plugin = createLoggingPlugin(sink);
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    const error = new Error("fail");
    const options = {};

    await plugin.onError?.({ request, error, options });

    expect(sink).toHaveBeenCalledWith(expect.objectContaining({
      type: "error",
      request,
      error,
      options,
      timestamp: expect.any(Number),
    }));
  });
});
