import { describe, expect, it } from "vitest";
import { HTTPRequest, HTTPRequestBuilder, type ParamValue } from "../http-request";

describe("HTTPRequestBuilder params", () => {
  it("removes parameters when value becomes undefined", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder.param("search", "value");
    builder.param("search", undefined);

    expect(builder.build().params).not.toHaveProperty("search");
  });

  it("merges array values without coercion", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    const first = ["alpha", undefined, "beta"] as ParamValue;
    const second = ["gamma"] as ParamValue;
    builder.param("tags", first);
    builder.param("tags", second);

    expect(builder.build().params.tags).toEqual(["alpha", "beta", "gamma"]);
  });

  it("merges nested objects deeply while dropping undefined", () => {
  const builder = HTTPRequestBuilder.create<HTTPRequest>();
  builder.param("filter", {
      status: "active",
      empty: undefined,
    });
    builder.param("filter", {
      owner: "me",
      empty: undefined,
    });

    expect(builder.build().params.filter).toEqual({
      status: "active",
      owner: "me",
    });
  });

  it("accepts dictionary merges with params() helper", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder.params({ lang: "en", region: undefined });

    const request = builder.build();
    expect(request.params).toEqual({
      lang: "en",
    });
  });
});

describe("query serialization options", () => {
  const baseUrl = "https://api.example.com";

  it("serializes arrays using repeat format by default", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder
      .url(baseUrl)
      .route("items")
      .param("tags", ["x", "y"] as ParamValue);

    const url = new URL(builder.build().fullUrl);
    expect(url.searchParams.getAll("tags")).toEqual(["x", "y"]);
  });

  it("supports bracket array format", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder
  .url(baseUrl)
  .route("items")
  .queryFormat({ arrayFormat: "brackets" })
  .param("tags", ["x", "y"] as ParamValue);

    const url = new URL(builder.build().fullUrl);
    expect(Array.from(url.searchParams.entries())).toEqual([
      ["tags[]", "x"],
      ["tags[]", "y"],
    ]);
  });

  it("supports index array format", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder
  .url(baseUrl)
  .route("items")
  .queryFormat({ arrayFormat: "indices" })
  .param("tags", ["x", "y"] as ParamValue);

    const url = new URL(builder.build().fullUrl);
    expect(Array.from(url.searchParams.entries())).toEqual([
      ["tags[0]", "x"],
      ["tags[1]", "y"],
    ]);
  });

  it("supports comma array format", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder
  .url(baseUrl)
  .route("items")
  .queryFormat({ arrayFormat: "comma" })
  .param("tags", ["x", "y"] as ParamValue);

    const url = new URL(builder.build().fullUrl);
    expect(url.searchParams.get("tags")).toBe("x,y");
  });

  it("supports json array format", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder
  .url(baseUrl)
  .route("items")
  .queryFormat({ arrayFormat: "json" })
  .param("tags", ["x", "y"] as ParamValue);

    const url = new URL(builder.build().fullUrl);
    expect(url.searchParams.get("tags")).toBe(JSON.stringify(["x", "y"]));
  });

  it("supports bracket object format by default", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder
  .url(baseUrl)
  .route("items")
  .param("filter", { owner: "me" } as ParamValue);

    const url = new URL(builder.build().fullUrl);
    expect(url.searchParams.get("filter[owner]"))
      .toBe("me");
  });

  it("supports dot object format", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder
  .url(baseUrl)
  .route("items")
  .queryFormat({ objectFormat: "dot" })
  .param("filter", { owner: "me" } as ParamValue);

    const url = new URL(builder.build().fullUrl);
    expect(url.searchParams.get("filter.owner")).toBe("me");
  });

  it("supports json object format", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder
  .url(baseUrl)
  .route("items")
  .queryFormat({ objectFormat: "json" })
  .param("filter", { owner: "me" } as ParamValue);

    const url = new URL(builder.build().fullUrl);
    expect(url.searchParams.get("filter")).toBe(
      JSON.stringify({ owner: "me" })
    );
  });

  it("uses a custom serializer when provided", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder
      .queryFormat({
        serializer: (params) => {
          const computed = new URLSearchParams();
          for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
              computed.append(`x-${key}`, String(value));
            }
          }
          return computed.toString();
        },
      })
      .queryFormat({ objectFormat: "dot" })
      .url(baseUrl)
      .route("items")
  .param("filter", "allowed");

    const url = builder.build().fullUrl;
    expect(new URL(url).search).toBe("?x-filter=allowed");
  });

  it("clears custom serializer when null is provided", () => {
    const builder = HTTPRequestBuilder.create<HTTPRequest>();
    builder
      .queryFormat({
        serializer: () => "foo=bar",
      })
      .queryFormat({ serializer: null })
      .url(baseUrl)
      .route("items")
  .param("tags", ["x", "y"] as ParamValue);

    const url = new URL(builder.build().fullUrl);
    expect(url.searchParams.getAll("tags")).toEqual(["x", "y"]);
  });
});

describe("builder cloning", () => {
  it("preserves query options when cloning", () => {
    const original = HTTPRequestBuilder.create<HTTPRequest>();
    original.queryFormat({ arrayFormat: "comma", objectFormat: "dot" });

    const clone = original.clone();
    clone.url("https://api.example.com").route("items");
    clone.param("tags", ["x", "y"] as ParamValue);

    const url = new URL(clone.build().fullUrl);
    expect(url.searchParams.get("tags")).toBe("x,y");
    expect(clone.build().queryOptions).toMatchObject({
      arrayFormat: "comma",
      objectFormat: "dot",
    });
  });

  it("does not mutate the source builder when clone is modified", () => {
    const original = HTTPRequestBuilder.create<HTTPRequest>();
    const clone = original.clone();
    clone.queryFormat({ arrayFormat: "comma" });

    const originalUrl = new URL(
      original
        .url("https://api.example.com")
        .route("items")
        .param("tags", ["x", "y"] as ParamValue)
        .build().fullUrl
    );

    expect(originalUrl.searchParams.getAll("tags")).toEqual(["x", "y"]);
  });
});
