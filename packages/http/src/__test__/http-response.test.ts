import { describe, expect, it } from "vitest";
import { HTTPResponse, HTTPResponseBuilder } from "../http-response";
import { HTTPRequest } from "../http-request";
import type { StatusCode } from "../types";

describe("HTTPResponse", () => {
  it("creates from raw response", () => {
    const raw = new HTTPResponse();
    raw.status = 200 as StatusCode;
    raw.statusText = "OK";
    raw.data = { foo: "bar" };
    raw.headers = { "content-type": "application/json" };
    raw.request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });

    const response = HTTPResponse.fromRaw(raw);
    expect(response).not.toBe(raw);
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ foo: "bar" });
    expect(response.headers).toEqual({ "content-type": "application/json" });
    expect(response.request).toBe(raw.request);
  });

  it("maps data with value", () => {
    const response = HTTPResponseBuilder.create()
      .status(200 as StatusCode)
      .data({ foo: "bar" })
      .build();

    const mapped = response.mapData("mapped");
    expect(mapped.data).toBe("mapped");
    expect(mapped.status).toBe(200);
  });

  it("maps data with function", () => {
    const response = HTTPResponseBuilder.create()
      .status(200 as StatusCode)
      .data({ foo: "bar" })
      .build();

    const mapped = response.mapData((data: unknown) => (data as { foo: string }).foo);
    expect(mapped.data).toBe("bar");
    expect(mapped.status).toBe(200);
  });
});

describe("HTTPResponseBuilder", () => {
  it("builds response", () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    const response = HTTPResponseBuilder.create()
      .status(201 as StatusCode)
      .statusText("Created")
      .data({ id: 1 })
      .headers({ "location": "/1" })
      .header("x-custom", "value")
      .request(request)
      .build();

    expect(response.status).toBe(201);
    expect(response.statusText).toBe("Created");
    expect(response.data).toEqual({ id: 1 });
    expect(response.headers).toEqual({
      "location": "/1",
      "x-custom": "value",
    });
    expect(response.request).toBe(request);
  });

  it("derives builder", () => {
    const request = new HTTPRequest({ baseUrl: "https://example.com", method: "GET" });
    const original = HTTPResponseBuilder.create()
      .status(200 as StatusCode)
      .data({ foo: "bar" })
      .request(request);

    const derived = original.derive()
      .status(404 as StatusCode)
      .data({ error: "not found" });

    const r1 = original.build();
    const r2 = derived.build();

    expect(r1.status).toBe(200);
    expect(r1.data).toEqual({ foo: "bar" });
    
    expect(r2.status).toBe(404);
    expect(r2.data).toEqual({ error: "not found" });
    expect(r2.request).toBe(request);
  });
});
