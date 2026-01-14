import { describe, expect, it, vi, beforeEach } from "vitest";
import { createFetchTransport } from "../fetch-transport";
import { HTTPRequest, HTTPRequestBuilder } from "../http-request";
import type { FetchLike } from "../fetch-transport";

describe("createFetchTransport", () => {
  let mockFetch: FetchLike;
  let transport: ReturnType<typeof createFetchTransport>;

  beforeEach(() => {
    mockFetch = vi.fn<FetchLike>().mockResolvedValue({
      status: 200,
      statusText: "OK",
      headers: new Map(),
      text: () => Promise.resolve('{"foo":"bar"}'),
    });
    transport = createFetchTransport(mockFetch);
  });

  it("should throw if no fetch implementation is available", () => {
    const originalFetch = globalThis.fetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).fetch;

    try {
      expect(() => createFetchTransport(undefined)).toThrow(
        "No fetch implementation available"
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should use global fetch if no implementation provided", async () => {
    const globalMockFetch = vi.fn().mockResolvedValue({
      status: 200,
      statusText: "OK",
      headers: new Map(),
      text: () => Promise.resolve("ok"),
    });
    const originalFetch = globalThis.fetch;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.fetch = globalMockFetch as any;

    try {
      const transport = createFetchTransport();
      const request = HTTPRequestBuilder.create()
        .method("GET")
        .url("http://example.com")
        .build();

      await transport.send(request, {});
      expect(globalMockFetch).toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("merges headers", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    request.headers = { "X-Base": "1" };
    
    await transport.send(request, { headers: { "X-Extra": "2" } });
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://example.com"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Base": "1",
          "X-Extra": "2",
        }),
      })
    );
  });

  it("serializes JSON body automatically", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "POST" });
    request.data = { foo: "bar" };
    
    await transport.send(request, {});
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: '{"foo":"bar"}',
        headers: expect.objectContaining({
          "content-type": "application/json",
        }),
      })
    );
  });

  it("does not override content-type if present", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "POST" });
    request.data = { foo: "bar" };
    request.headers = { "Content-Type": "application/custom" };
    
    await transport.send(request, {});
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: '{"foo":"bar"}',
        headers: expect.objectContaining({
          "Content-Type": "application/custom",
        }),
      })
    );
  });

  it("handles string body", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "POST" });
    request.data = "raw string";
    
    await transport.send(request, {});
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: "raw string",
      })
    );
  });

  it("handles null/undefined body", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    request.data = null;
    
    await transport.send(request, {});
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: undefined,
      })
    );
  });

  it("handles ArrayBuffer body", async () => {
    const buffer = new TextEncoder().encode("raw bytes").buffer;
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "POST" });
    request.data = buffer;
    
    await transport.send(request, {});
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: buffer,
      })
    );
  });

  it("handles ArrayBufferView body", async () => {
    const view = new TextEncoder().encode("raw bytes");
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "POST" });
    request.data = view;
    
    await transport.send(request, {});
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: view,
      })
    );
  });

  it("handles 205 Reset Content", async () => {
    mockFetch.mockResolvedValue({
      status: 205,
      statusText: "Reset Content",
      headers: new Map(),
      text: async () => "",
    });

    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    const response = await transport.send(request, {});
    
    expect(response.data).toBeNull();
  });

  it("passes signal option", async () => {
    const controller = new AbortController();
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    
    await transport.send(request, { signal: controller.signal });
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        signal: controller.signal,
      })
    );
  });

  it("uses option body if provided", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "POST" });
    request.data = { foo: "bar" };
    
    await transport.send(request, { body: "override" });
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: "override",
      })
    );
  });

  it("should return null body for 204 status", async () => {
    mockFetch.mockResolvedValue({
      status: 204,
      statusText: "No Content",
      headers: new Map(),
      text: () => Promise.resolve(""),
    });

    const request = HTTPRequestBuilder.create()
      .method("GET")
      .url("http://example.com")
      .build();

    const response = await transport.send(request, {});
    expect(response.data).toBeNull();
  });
});
