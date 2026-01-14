import { describe, expect, it, vi, beforeEach } from "vitest";
import { createAxiosTransport } from "../axios-transport";
import { HTTPRequest, HTTPRequestBuilder } from "../http-request";

describe("createAxiosTransport", () => {
  it("throws if axios instance is invalid", () => {
    // @ts-expect-error Testing invalid input
    expect(() => createAxiosTransport(undefined)).toThrow("Axios transport requires an axios-like client instance");
    // @ts-expect-error Testing invalid input
    expect(() => createAxiosTransport({})).toThrow("Axios transport requires an axios-like client instance");
  });

  it("creates transport with valid axios instance", () => {
    const mockAxios = { request: vi.fn() };
    const transport = createAxiosTransport(mockAxios);
    expect(transport).toBeDefined();
  });
});

describe("AxiosTransport.send", () => {
  const mockAxios = { request: vi.fn() };
  const transport = createAxiosTransport(mockAxios);

  beforeEach(() => {
    vi.clearAllMocks();
    mockAxios.request.mockResolvedValue({
      status: 200,
      statusText: "OK",
      data: {},
      headers: {},
    });
  });

  it("calls axios.request with correct config", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    await transport.send(request, {});
    
    expect(mockAxios.request).toHaveBeenCalledWith(expect.objectContaining({
      url: "https://example.com/",
      method: "GET",
      validateStatus: expect.any(Function),
    }));
  });

  it("merges headers", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    request.headers = { "X-Base": "1" };
    
    await transport.send(request, { headers: { "X-Extra": "2" } });
    
    expect(mockAxios.request).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.objectContaining({
        "X-Base": "1",
        "X-Extra": "2",
      }),
    }));
  });

  it("handles streaming response config", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    
    await transport.send(request, { streamResponse: true });
    
    expect(mockAxios.request).toHaveBeenCalledWith(expect.objectContaining({
      responseType: "stream",
    }));
  });

  it("preserves existing responseType if not streaming", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    
    await transport.send(request, { responseType: "blob" });
    
    expect(mockAxios.request).toHaveBeenCalledWith(expect.objectContaining({
      responseType: "blob",
    }));
  });

  it("returns normalized response", async () => {
    mockAxios.request.mockResolvedValue({
      status: 201,
      statusText: "Created",
      data: { id: 1 },
      headers: { "location": "/1" },
    });

    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "POST" });
    const response = await transport.send(request, {});
    
    expect(response).toEqual({
      status: 201,
      statusText: "Created",
      data: { id: 1 },
      headers: { "location": "/1" },
    });
  });

  it("does not pass params separately when fullUrl already contains query string", async () => {
    const request = HTTPRequestBuilder.create()
      .method("GET")
      .url("https://example.com")
      .route("items")
      .param("tags", ["x", "y"] as ParamValue)
      .build();

    await transport.send(request, {});

    const config = mockAxios.request.mock.calls[0]?.[0] as { url?: string; params?: unknown } | undefined;
    expect(config?.url).toContain("tags=x");
    expect(config?.url).toContain("tags=y");
    expect(config?.params).toBeUndefined();
  });

  it("uses default validateStatus that always returns true", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    await transport.send(request, {});
    
    const config = mockAxios.request.mock.calls[0][0];
    expect(config.validateStatus(500)).toBe(true);
    expect(config.validateStatus(200)).toBe(true);
  });

  it("removes header if override is null/undefined", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    request.headers = { "X-Keep": "1", "X-Remove": "2" };
    
    await transport.send(request, { headers: { "X-Remove": null } });
    
    expect(mockAxios.request).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.objectContaining({
        "X-Keep": "1",
      }),
    }));
    const headers = mockAxios.request.mock.calls[0][0].headers;
    expect(headers).not.toHaveProperty("X-Remove");
  });

  it("ignores null/undefined in base headers", async () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    request.headers = { "X-Null": null, "X-Valid": "1" } as unknown as Record<string, string>;
    
    await transport.send(request, { headers: {} });
    
    const headers = mockAxios.request.mock.calls[0][0].headers;
    expect(headers).toHaveProperty("X-Valid", "1");
    expect(headers).not.toHaveProperty("X-Null");
  });

  it("handles missing response headers", async () => {
    mockAxios.request.mockResolvedValue({
      status: 200,
      statusText: "OK",
      data: {},
      headers: undefined,
    });

    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    const response = await transport.send(request, {});
    
    expect(response.headers).toEqual({});
  });

  it("should merge headers correctly handling null/undefined", async () => {
    const axios = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: {},
      }),
    };

    const transport = createAxiosTransport(axios);
    const request = HTTPRequestBuilder.create()
      .method("GET")
      .url("http://example.com")
      .header("x-base", "base")
      .header("x-remove", "remove")
      .build();

    await transport.send(request, {
      headers: {
        "x-override": "override",
        "x-remove": null, // Should remove the header
        "x-ignore": undefined, // Should be ignored
      },
    });

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          "x-base": "base",
          "x-override": "override",
        },
      })
    );
  });

  it("should handle streamResponse option", async () => {
    const axios = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: {},
      }),
    };

    const transport = createAxiosTransport(axios);
    const request = HTTPRequestBuilder.create()
      .method("GET")
      .url("http://example.com")
      .build();

    await transport.send(request, {
      streamResponse: true,
    });

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        responseType: "stream",
      })
    );
  });

  it("should preserve existing responseType if streamResponse is true", async () => {
    const axios = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        statusText: "OK",
        headers: {},
        data: {},
      }),
    };

    const transport = createAxiosTransport(axios);
    const request = HTTPRequestBuilder.create()
      .method("GET")
      .url("http://example.com")
      .build();

    await transport.send(request, {
      streamResponse: true,
      responseType: "blob",
    });

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        responseType: "blob",
      })
    );
  });
});
