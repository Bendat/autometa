import { describe, expect, test } from "vitest";

import { createEnsureFactory, ensure as baseEnsure } from "@autometa/assertions";

import { httpAssertionsPlugin } from "../assertions/http-assertions-plugin";

describe("httpAssertionsPlugin", () => {
  test("ensure.http(response).toHaveStatus works", () => {
    const ensureFactory = createEnsureFactory(baseEnsure, {
      http: httpAssertionsPlugin<{}>(),
    });

    const ensure = ensureFactory({});
    const response = {
      data: { ok: true },
      headers: { "x-correlation-id": "abc-123", "cache-control": "public, max-age=60" },
      status: 200,
      statusText: "OK",
    };

    expect(() => {
      ensure.http(response).toHaveStatus(200).toHaveCorrelationId().toBeCacheable();
    }).not.toThrow();
  });

  test("ensure.not.http(response).toHaveStatus negates as expected", () => {
    const ensureFactory = createEnsureFactory(baseEnsure, {
      http: httpAssertionsPlugin<{}>(),
    });

    const ensure = ensureFactory({});
    const response = {
      data: { ok: true },
      headers: {},
      status: 200,
      statusText: "OK",
    };

    expect(() => {
      ensure.not.http(response).toHaveStatus(200);
    }).toThrow();

    expect(() => {
      ensure.not.http(response).toHaveStatus(201);
    }).not.toThrow();
  });

  test("ensure.http(response).not.toHaveStatus also negates", () => {
    const ensureFactory = createEnsureFactory(baseEnsure, {
      http: httpAssertionsPlugin<{}>(),
    });

    const ensure = ensureFactory({});
    const response = {
      data: { ok: true },
      headers: {},
      status: 200,
      statusText: "OK",
    };

    expect(() => {
      ensure.http(response).not.toHaveStatus(201);
    }).not.toThrow();

    expect(() => {
      ensure.http(response).not.toHaveStatus(200);
    }).toThrow();
  });
});
