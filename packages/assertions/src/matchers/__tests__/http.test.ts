import { describe, expect, it } from "vitest";

import { EnsureError, ensure } from "../../index";
import { fromFetchResponse, fromHttpResponse } from "../http";

interface PlainResponse {
  status: number;
  statusText?: string;
  headers: Record<string, string>;
  data?: unknown;
}

describe("http matchers", () => {
  it("matches exact status codes", () => {
    const response = new Response(null, {
      status: 204,
      headers: { "x-correlation-id": "abc" },
    });

    const chain = ensure(fromFetchResponse(response)).toHaveStatus(204);
    expect(chain.value.status).toBe(204);
  });

  it("matches status ranges", () => {
    const response = new Response(null, { status: 201 });
    const chain = ensure(fromFetchResponse(response)).toHaveStatus("2xx");
    expect(chain.value.status).toBe(201);
  });

  it("throws when status expectation fails", () => {
    const response = new Response(null, { status: 500 });
    expect(() => ensure(fromFetchResponse(response)).toHaveStatus(200)).toThrowError(EnsureError);
  });

  it("supports header existence checks", () => {
    const response = new Response(null, {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const chain = ensure(fromFetchResponse(response)).toHaveHeader("content-type");
    expect(chain.value.status).toBe(200);
  });

  it("supports header value matching", () => {
    const response = new Response(null, {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const chain = ensure(fromFetchResponse(response)).toHaveHeader("Content-Type", /json/);
    expect(chain.value.status).toBe(200);
  });

  it("throws when header value mismatches", () => {
    const response = new Response(null, {
      status: 200,
      headers: { "content-type": "text/plain" },
    });

    expect(() =>
      ensure(fromFetchResponse(response)).toHaveHeader("content-type", "application/json")
    ).toThrowError(
      EnsureError
    );
  });

  it("detects cacheable responses", () => {
    const response: PlainResponse = {
      status: 200,
      headers: {
        "cache-control": "public, max-age=60, immutable",
      },
    };

    const chain = ensure(response).toBeCacheable({ maxAge: 60, cacheability: "public", immutable: true });
    expect(chain.value).toBe(response);
  });

  it("fails when cache directives are missing", () => {
    const response: PlainResponse = {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    };

    expect(() => ensure(response).toBeCacheable()).toThrowError(EnsureError);
  });

  it("validates correlation identifier presence", () => {
    const response: PlainResponse = {
      status: 200,
      headers: {
        "x-correlation-id": "corr-123",
      },
    };

    const chain = ensure(response).toHaveCorrelationId();
    expect(chain.value).toBe(response);
  });

  it("fails when correlation identifier missing", () => {
    const response: PlainResponse = {
      status: 200,
      headers: {},
    };

    expect(() => ensure(response).toHaveCorrelationId()).toThrowError(EnsureError);
  });

  it("allows negated header assertions", () => {
    const response = new Response(null, { status: 200 });
    const chain = ensure(fromFetchResponse(response)).not.toHaveHeader("x-deprecated");
    expect(chain.value.status).toBe(200);
  });

  it("supports HTTPResponse adapter", () => {
    const response = {
      status: 200,
      statusText: "OK",
      data: { ok: true },
      headers: { "cache-control": "public, max-age=120" },
    };

    const chain = ensure(fromHttpResponse(response)).toBeCacheable({ maxAge: 120 });
    expect(chain.value.data).toEqual({ ok: true });
  });
});