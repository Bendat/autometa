import { describe, expect, it } from "vitest";
import type { ReadableStream } from "node:stream/web";
import { HTTP } from "../src/http";
import type { HTTPPlugin } from "../src/plugins";

interface JsonPlaceholderPost {
  userId: number;
  id: number;
  title: string;
  body: string;
}

interface JsonPlaceholderComment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

const JSON_PLACEHOLDER = "https://jsonplaceholder.typicode.com";
const HTTP_BIN = "https://httpbin.org";

interface HttpBinGetResponse {
  args: Record<string, string | string[]>;
  url: string;
}

describe("HTTP integration with JSONPlaceholder", () => {
  it("performs a simple GET request", async () => {
    const response = await HTTP.create()
      .url(JSON_PLACEHOLDER)
      .route("posts", 1)
      .get<JsonPlaceholderPost>();

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({ id: 1 });

    const titleOnly = response.mapData((post: JsonPlaceholderPost) => post.title);
    expect(titleOnly.data).toBe(response.data.title);
    expect(titleOnly.status).toBe(response.status);
  });

  it("supports query parameters and response plugins", async () => {
    const events: Array<{ type: "request" | "response"; value: unknown }> = [];
    const plugin: HTTPPlugin = {
      async onRequest(ctx) {
        events.push({ type: "request", value: ctx.request.fullUrl });
      },
      async onResponse(ctx) {
        events.push({ type: "response", value: ctx.response.status });
      },
    };

    const client = HTTP.create({ plugins: [plugin] })
      .url(JSON_PLACEHOLDER)
      .route("comments")
      .param("postId", 1);

    const response = await client.get<JsonPlaceholderComment[]>();

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
    expect(response.data.every((comment) => comment.postId === 1)).toBe(true);

    expect(events.some((event) => event.type === "request")).toBe(true);
    expect(events.some((event) => event.type === "response")).toBe(true);
  });

  it("performs a POST request with a JSON body", async () => {
    const payload: Omit<JsonPlaceholderPost, "id"> = {
      userId: 42,
      title: "Integration Title",
      body: "Integration Body",
    };

    const response = await HTTP.create()
      .url(JSON_PLACEHOLDER)
      .route("posts")
      .data(payload)
      .post<JsonPlaceholderPost>();

    expect([200, 201]).toContain(response.status);
    expect(response.data).toMatchObject(payload);
    expect(typeof response.data.id).toBe("number");
  });

  it("formats query parameters including repeated array values", async () => {
    const response = await HTTP.create()
      .url(HTTP_BIN)
      .route("get")
      .param("search", "widgets")
      .param("cars", ["Saab", "Audi"])
      .param("tags", "alpha", "beta")
      .params({ optional: undefined })
      .get<HttpBinGetResponse>();

    const url = new URL(response.request.fullUrl);
    expect(url.searchParams.get("search")).toBe("widgets");
    expect(url.searchParams.getAll("cars")).toStrictEqual(["Saab", "Audi"]);
    expect(url.searchParams.getAll("tags")).toStrictEqual(["alpha", "beta"]);
    expect(url.searchParams.has("optional")).toBe(false);

    expect(response.data.args.cars).toStrictEqual(["Saab", "Audi"]);
    expect(response.data.args.search).toBe("widgets");
    expect(response.data.args.tags).toStrictEqual(["alpha", "beta"]);
  });

  it("serializes nested object params using bracket notation by default", async () => {
    const response = await HTTP.create()
      .url(HTTP_BIN)
      .route("get")
      .param("filter", { owner: "me", scope: { region: "us" } })
      .get<HttpBinGetResponse>();

    const url = new URL(response.request.fullUrl);
    expect(url.searchParams.get("filter[owner]")).toBe("me");
    expect(url.searchParams.get("filter[scope][region]")).toBe("us");

    expect(response.data.args["filter[owner]"]).toBe("me");
    expect(response.data.args["filter[scope][region]"]).toBe("us");
  });

  it("supports dot object query format", async () => {
    const response = await HTTP.create()
      .queryFormat({ objectFormat: "dot" })
      .url(HTTP_BIN)
      .route("get")
      .param("filter", { owner: "me", scope: { region: "us" } })
      .get<HttpBinGetResponse>();

    const url = new URL(response.request.fullUrl);
    expect(url.searchParams.get("filter.owner")).toBe("me");
    expect(url.searchParams.get("filter.scope.region")).toBe("us");

    expect(response.data.args["filter.owner"]).toBe("me");
    expect(response.data.args["filter.scope.region"]).toBe("us");
  });

  it("supports json object query format", async () => {
    const filter = { owner: "me", scope: { region: "us" } };
    const response = await HTTP.create()
      .queryFormat({ objectFormat: "json" })
      .url(HTTP_BIN)
      .route("get")
      .param("filter", filter)
      .get<HttpBinGetResponse>();

    const serialized = JSON.stringify(filter);
    const url = new URL(response.request.fullUrl);
    expect(url.searchParams.get("filter")).toBe(serialized);

    expect(response.data.args.filter).toBe(serialized);
  });

  it("supports bracket array format via queryFormat", async () => {
    const response = await HTTP.create()
      .queryFormat({ arrayFormat: "brackets" })
      .url(HTTP_BIN)
      .route("get")
      .param("tags", ["alpha", "beta"])
      .get<HttpBinGetResponse>();

    const url = new URL(response.request.fullUrl);
    expect(url.searchParams.getAll("tags[]")).toStrictEqual(["alpha", "beta"]);

    expect(response.data.args["tags[]"]).toStrictEqual(["alpha", "beta"]);
  });

  it(
    "streams responses without JSON parsing when stream() is used",
    async () => {
      const result = await HTTP.create()
        .url(HTTP_BIN)
        .route("stream", 3)
        .stream<ReadableStream<Uint8Array | string | null>>();

      const stream = result.data;
      expect(stream).toBeDefined();

  const reader = (stream as ReadableStream<Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          chunks.push(value);
        }
      }

      const decoder = new TextDecoder("utf8");
      let text = "";
      for (const chunk of chunks) {
        text += decoder.decode(chunk, { stream: true });
      }
      text += decoder.decode();
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      expect(lines.length).toBe(3);
      for (const line of lines) {
        const payload = JSON.parse(line);
        expect(typeof payload.id).toBe("number");
      }
    },
    15000
  );
});
