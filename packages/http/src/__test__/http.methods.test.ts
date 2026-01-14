import { describe, expect, it, vi, beforeEach } from "vitest";
import { HTTP } from "../http";
import type { HTTPRequest } from "../http-request";
import type { HTTPTransport, HTTPTransportResponse } from "../transport";
import type { HTTPAdditionalOptions, StatusCode } from "../types";

describe("HTTP Methods and Configuration", () => {
  const mockTransport: HTTPTransport = {
    send: vi.fn(async <TRequest, TResponse>(
      _request: HTTPRequest<TRequest>,
      _options: HTTPAdditionalOptions<Record<string, unknown>>
    ): Promise<HTTPTransportResponse<TResponse>> => {
      return {
        status: 200 as StatusCode,
        statusText: "OK",
        headers: {},
        data: {} as TResponse,
      };
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const client = HTTP.create({ transport: mockTransport }).url("https://example.com");

  it("executes GET request", async () => {
    await client.get();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "GET", fullUrl: "https://example.com/" }),
      expect.anything()
    );
  });

  it("executes POST request", async () => {
    await client.post();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "POST", fullUrl: "https://example.com/" }),
      expect.anything()
    );
  });

  it("executes PUT request", async () => {
    await client.put();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "PUT", fullUrl: "https://example.com/" }),
      expect.anything()
    );
  });

  it("executes PATCH request", async () => {
    await client.patch();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "PATCH", fullUrl: "https://example.com/" }),
      expect.anything()
    );
  });

  it("executes DELETE request", async () => {
    await client.delete();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "DELETE", fullUrl: "https://example.com/" }),
      expect.anything()
    );
  });

  it("executes HEAD request", async () => {
    await client.head();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "HEAD", fullUrl: "https://example.com/" }),
      expect.anything()
    );
  });

  it("executes OPTIONS request", async () => {
    await client.options();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "OPTIONS", fullUrl: "https://example.com/" }),
      expect.anything()
    );
  });

  it("executes TRACE request", async () => {
    await client.trace();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "TRACE", fullUrl: "https://example.com/" }),
      expect.anything()
    );
  });

  it("executes CONNECT request", async () => {
    await client.connect();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: "CONNECT", fullUrl: "https://example.com/" }),
      expect.anything()
    );
  });

  it("applies shared headers", async () => {
    const c = HTTP.create({ transport: mockTransport })
      .url("https://example.com")
      .sharedHeader("X-Shared", "true");
    
    await c.get();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ headers: expect.objectContaining({ "X-Shared": "true" }) }),
      expect.anything()
    );

    await c.header("X-Instance", "1").get();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ headers: expect.objectContaining({ "X-Shared": "true", "X-Instance": "1" }) }),
      expect.anything()
    );
  });

  it("applies shared params", async () => {
    const c = HTTP.create({ transport: mockTransport })
      .url("https://example.com")
      .sharedParam("sort", "asc");
    
    await c.get();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ fullUrl: "https://example.com/?sort=asc" }),
      expect.anything()
    );

    await c.param("page", 1).get();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ fullUrl: "https://example.com/?sort=asc&page=1" }),
      expect.anything()
    );
  });

  it("applies route segments", async () => {
    const c = HTTP.create({ transport: mockTransport })
      .url("https://example.com")
      .sharedRoute("api", "v1");
    
    await c.get();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ fullUrl: "https://example.com/api/v1" }),
      expect.anything()
    );

    await c.route("users").get();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ fullUrl: "https://example.com/api/v1/users" }),
      expect.anything()
    );
  });

  it("applies data body", async () => {
    const c = HTTP.create({ transport: mockTransport })
      .url("https://example.com")
      .sharedData({ foo: "bar" });
    
    await c.post();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { foo: "bar" } }),
      expect.anything()
    );

    await c.data({ baz: "qux" }).post();
    expect(mockTransport.send).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { baz: "qux" } }),
      expect.anything()
    );
  });

  it("supports useTransport", async () => {
    const otherTransport: HTTPTransport = {
      send: vi.fn(async <TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> => {
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: {} as unknown as TResponse,
        };
      }) as HTTPTransport["send"],
    };

    const c = HTTP.create({ transport: mockTransport }).url("https://example.com");
    c.useTransport(otherTransport);
    
    await c.get();
    expect(otherTransport.send).toHaveBeenCalled();
    expect(mockTransport.send).not.toHaveBeenCalled(); // Should use the new transport
  });

  it("supports withTransport", async () => {
    const otherTransport: HTTPTransport = {
      send: vi.fn(async <TRequest, TResponse>(
        _request: HTTPRequest<TRequest>,
        _options: HTTPAdditionalOptions<Record<string, unknown>>
      ): Promise<HTTPTransportResponse<TResponse>> => {
        return {
          status: 200 as StatusCode,
          statusText: "OK",
          headers: {},
          data: {} as unknown as TResponse,
        };
      }) as HTTPTransport["send"],
    };

    const c = HTTP.create({ transport: mockTransport }).url("https://example.com");
    const derived = c.withTransport(otherTransport);
    
    await derived.get();
    expect(otherTransport.send).toHaveBeenCalled();
    
    await c.get();
    expect(mockTransport.send).toHaveBeenCalled(); // Original should still use mockTransport
  });
});
