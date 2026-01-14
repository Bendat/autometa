import { describe, expect, it, vi } from "vitest";
import { HTTP } from "../http";
import type { HTTPTransport } from "../transport";
import type { StatusCode } from "../types";

describe("HTTP Configuration", () => {
  const mockTransport: HTTPTransport = {
    send: vi.fn(async () => ({
      status: 200 as StatusCode,
      statusText: "OK",
      headers: {},
      data: {},
    })),
  };

  const client = HTTP.create({ transport: mockTransport }).url("https://example.com");

  it("configures retry", async () => {
    const c = client.sharedRetry({ attempts: 3 });
    await c.get();
    // Verification would require inspecting internal state or behavior on failure
    // For now we just ensure the method works and returns the client
    expect(c).toBeInstanceOf(HTTP);
    
    const derived = c.retry({ attempts: 1 });
    expect(derived).not.toBe(c);
  });

  it("configures timeout", async () => {
    const c = client.sharedTimeout(1000);
    await c.get();
    expect(c).toBeInstanceOf(HTTP);
    
    const derived = c.timeout(500);
    expect(derived).not.toBe(c);
  });

  it("configures stream response", async () => {
    const c = client.sharedStreamResponse(true);
    await c.get();
    expect(c).toBeInstanceOf(HTTP);
    
    const derived = c.streamResponse(false);
    expect(derived).not.toBe(c);
    
    const stream = c.asStream();
    expect(stream).not.toBe(c);
    
    await c.stream();
  });

  it("configures throw on server error", async () => {
    const c = client.sharedThrowOnServerError(true);
    await c.get();
    expect(c).toBeInstanceOf(HTTP);
    
    const derived = c.throwOnServerError(false);
    expect(derived).not.toBe(c);
  });

  it("configures hooks", async () => {
    const hook = vi.fn();
    const c = client.sharedOnSend("test", hook).sharedOnReceive("test", hook);
    await c.get();
    expect(hook).toHaveBeenCalledTimes(2); // Once for send, once for receive
    
    const derived = c.onSend("derived", hook).onReceive("derived", hook);
    await derived.get();
    expect(hook).toHaveBeenCalledTimes(6); // 2 from shared + 2 from derived + 2 previous
  });

  it("configures schema", async () => {
    const parser = vi.fn((data) => data);
    const c = client.sharedSchema(parser, 200 as StatusCode);
    await c.get();
    expect(c).toBeInstanceOf(HTTP);
    
    const derived = c.schema(parser, { from: 200 as StatusCode, to: 299 as StatusCode });
    expect(derived).not.toBe(c);
  });

  it("configures query format", async () => {
    const c = client.sharedQueryFormat({ arrayFormat: "comma" });
    await c.get();
    expect(c).toBeInstanceOf(HTTP);
    
    const derived = c.queryFormat({ arrayFormat: "brackets" });
    expect(derived).not.toBe(c);
  });

  it("configures plain text", async () => {
    const c = client.sharedAllowPlainText(true);
    await c.get();
    expect(c).toBeInstanceOf(HTTP);
    
    const derived = c.allowPlainText(false);
    expect(derived).not.toBe(c);
  });

  it("configures require schema", async () => {
    const c = client.requireSchema(true);
    await c.get();
    expect(c).toBeInstanceOf(HTTP);
  });
  
  it("registers shared plugin", () => {
    const plugin = { name: "test" };
    HTTP.registerSharedPlugin(plugin);
    expect(HTTP.getSharedPlugins()).toContain(plugin);
    
    HTTP.setSharedPlugins([]);
    expect(HTTP.getSharedPlugins()).toEqual([]);
  });

  it("uses plugin", async () => {
    const plugin = { onRequest: vi.fn() };
    const c = client.use(plugin);
    await c.get();
    expect(plugin.onRequest).toHaveBeenCalled();
  });

  it("uses scoped plugin", async () => {
    const plugin = { onRequest: vi.fn() };
    const c = client.plugin(plugin);
    await c.get();
    expect(plugin.onRequest).toHaveBeenCalled();
    
    await client.get();
    expect(plugin.onRequest).toHaveBeenCalledTimes(1); // Only called on derived client
  });
  
  it("applies shared options", async () => {
     const c = client.sharedOptions({ foo: "bar" });
     await c.get();
     expect(c).toBeInstanceOf(HTTP);
     
     const derived = c.withOptions({ baz: "qux" });
     expect(derived).not.toBe(c);
  });
  
  it("applies abort signal", async () => {
     const controller = new AbortController();
     const c = client.sharedAbortSignal(controller.signal);
     await c.get();
     expect(c).toBeInstanceOf(HTTP);
     
     const derived = c.abortSignal(new AbortController().signal);
     expect(derived).not.toBe(c);
  });
});
