import { describe, expect, it } from "vitest";
import { HTTPRequest, HTTPRequestBuilder } from "./http-request";

describe("HTTP Request", () => {
  it("should derive a detailed request", () => {
    const request = new HTTPRequest();
    request.baseUrl = "https://example.com";
    request.route.push("foo", "bar");
    request.params = { foo: "bar" };
    request.data = { foo: "bar" };
    request.headers = { foo: "bar" };
    request.method = "GET";

    const derived = HTTPRequest.derive(request);
    expect(derived).toEqual({
      baseUrl: "https://example.com",
      route: ["foo", "bar"],
      params: { foo: "bar" },
      data: { foo: "bar" },
      headers: { foo: "bar" },
      method: "GET"
    });
  });

  describe("HTTPRequestBuilder", () => {
    it("should build a request from a base", () => {
      const request = new HTTPRequest();
      request.baseUrl = "https://example.com";
      request.route.push("foo", "bar");
      request.params = { foo: "bar" };
      request.data = { foo: "bar" };
      request.headers = { foo: "bar" };
      request.method = "GET";
      const builder = new HTTPRequestBuilder(request);
      expect(builder.request).toEqual(request);
    });

    it("should build a request from scratch", () => {
      const builder = new HTTPRequestBuilder()
        .url("https://example.com")
        .route("foo", "bar")
        .param("foo", "bar")
        .data({ foo: "bar" })
        .header("foo", "bar")
        .method("GET");
      expect(builder.request).toEqual({
        baseUrl: "https://example.com",
        route: ["foo", "bar"],
        params: { foo: "bar" },
        data: { foo: "bar" },
        headers: { foo: "bar" },
        method: "GET"
      });
    });

      it("should derive a request builder", () => {
        const builder = new HTTPRequestBuilder()
          .url("https://example.com")
          .route("foo", "bar")
          .param("foo", "bar")
          .data({ foo: "bar" })
          .header("foo", "bar")
          .method("GET");
        const derived = builder.derive();
        expect(derived.request).toEqual(builder.request);
        expect(derived.request).not.toBe(builder.request);
      });


    describe("build", () => {
      it("should build a request", () => {
        const request = new HTTPRequestBuilder()
          .url("https://example.com")
          .route("foo", "bar")
          .param("foo", "bar")
          .data({ foo: "bar" })
          .header("foo", "bar")
          .method("GET")
          .build();
        expect(request).toEqual({
          baseUrl: "https://example.com",
          route: ["foo", "bar"],
          params: { foo: "bar" },
          data: { foo: "bar" },
          headers: { foo: "bar" },
          method: "GET"
        });
      });
    });

    describe("paramList", () => {
      it("should build a request with a list of params", () => {
        const request = new HTTPRequestBuilder()
          .url("https://example.com")
          .route("foo", "bar")
          .param("foo", ["bar", "baz"])
          .data({ foo: "bar" })
          .header("foo", "bar")
          .method("GET")
          .build();
        expect(request).toEqual({
          baseUrl: "https://example.com",
          route: ["foo", "bar"],
          params: { foo: ["bar", "baz"] },
          data: { foo: "bar" },
          headers: { foo: "bar" },
          method: "GET"
        });
      });
    });

    describe("fullUrl", () => {
      it("should have a full url with routes", () => {
        const request = new HTTPRequestBuilder()
          .url("https://example.com")
          .route("foo")
          .build().fullUrl;
        expect(request).toEqual("https://example.com/foo");
      });
      it("should have a full url with routes and params", () => {
        const request = new HTTPRequestBuilder()
          .url("https://example.com")
          .route("foo")
          .param("gru", "bar")
          .build().fullUrl;
        expect(request).toEqual("https://example.com/foo?gru=bar");
      });

      it("should have a full url with a route and a param list", () => {
        const request = new HTTPRequestBuilder()
          .url("https://example.com")
          .route("foo")
          .param("bob", ["bar", "baz"])
          .build().fullUrl;
        expect(request).toEqual("https://example.com/foo?bob=bar%2Cbaz");
      });
    });
  });

  describe("dynamic header", () => {
    it("should resolve a synchronous dynamic header", async () => {
      const builder = new HTTPRequestBuilder()
        .url("https://example.com")
        .route("foo", "bar")
        .param("foo", "bar")
        .data({ foo: "bar" })
        .header("foo", "bar")
        .header("dynamic", () => "foo")
        .method("GET");
      await builder.resolveDynamicHeaders();
      expect(builder.request.headers).toEqual({
        foo: "bar",
        dynamic: "foo"
      });
    });

    it("should resolve an asynchronous dynamic header", async () => {
      const builder = new HTTPRequestBuilder()
        .url("https://example.com")
        .route("foo", "bar")
        .param("foo", "bar")
        .data({ foo: "bar" })
        .header("foo", "bar")
        .header("dynamic", async () => "foo")
        .method("GET");
      await builder.resolveDynamicHeaders();
      expect(builder.request.headers).toEqual({
        foo: "bar",
        dynamic: "foo"
      });
    });
  });
});
