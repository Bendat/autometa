import { describe, expect, it } from "vitest";
import { ReadableStream } from "node:stream/web";
import { HTTP, type HTTPCreateOptions } from "../src/http";
import type { HTTPRequest } from "../src/http-request";
import type { HTTPPlugin } from "../src/plugins";
import type { HTTPTransport, HTTPTransportResponse } from "../src/transport";
import type { HTTPAdditionalOptions, StatusCode } from "../src/types";

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

function createClient(options: HTTPCreateOptions = {}) {
  return HTTP.create({ ...options, transport: createMockTransport() });
}

function createMockTransport(): HTTPTransport<{ streamResponse?: boolean }> {
  let nextPostId = 101;

  return {
    async send<TRequest, TResponse>(
      request: HTTPRequest<TRequest>,
      options: HTTPAdditionalOptions<{ streamResponse?: boolean }>
    ): Promise<HTTPTransportResponse<TResponse>> {
      const url = new URL(request.fullUrl ?? "", "http://localhost");
      const method = request.method ?? "GET";

      if (url.origin === JSON_PLACEHOLDER) {
        if (method === "GET" && url.pathname === "/posts/1") {
          return createJsonResponse({
            userId: 1,
            id: 1,
            title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
            body: "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
          }) as HTTPTransportResponse<TResponse>;
        }

        if (method === "GET" && url.pathname === "/comments") {
          const postId = Number.parseInt(url.searchParams.get("postId") ?? "1", 10);
          const comments: JsonPlaceholderComment[] = Array.from({ length: 5 }, (_, index) => ({
            postId,
            id: index + 1,
            name: `comment-${index + 1}`,
            email: `user${index + 1}@example.com`,
            body: `Comment body ${index + 1}`,
          }));
          return createJsonResponse(comments) as HTTPTransportResponse<TResponse>;
        }

        if (method === "POST" && url.pathname === "/posts") {
          const payload = request.data as Omit<JsonPlaceholderPost, "id">;
          const responseBody: JsonPlaceholderPost = {
            ...payload,
            id: nextPostId++,
          };
          return createJsonResponse(responseBody, {
            status: 201,
            statusText: "Created",
          }) as HTTPTransportResponse<TResponse>;
        }
      }

      if (url.origin === HTTP_BIN) {
        if (method === "GET" && url.pathname === "/get") {
          return createJsonResponse({
            args: extractArgs(url),
            url: url.toString(),
          }) as HTTPTransportResponse<TResponse>;
        }

        if (method === "GET" && url.pathname === "/stream/3") {
          if (options.streamResponse) {
            return createStreamResponse() as HTTPTransportResponse<TResponse>;
          }
          return createJsonResponse({}) as HTTPTransportResponse<TResponse>;
        }
      }

      throw new Error(`Unhandled request: ${method} ${url.toString()}`);
    },
  } satisfies HTTPTransport<{ streamResponse?: boolean }>;
}

function createJsonResponse(
  body: unknown,
  init: { status?: number; statusText?: string } = {}
): HTTPTransportResponse<string> {
  const status = (init.status ?? 200) as StatusCode;
  return {
    status,
    statusText: init.statusText ?? "OK",
    headers: { "content-type": "application/json" },
    data: JSON.stringify(body),
  };
}

function extractArgs(url: URL) {
  const args: Record<string, string | string[]> = {};
  const keys = new Set<string>();
  for (const key of url.searchParams.keys()) {
    keys.add(key);
  }

  for (const key of keys) {
    const values = url.searchParams.getAll(key);
    if (values.length === 0) {
      continue;
    }
    args[key] = values.length === 1 ? values[0] : values;
  }

  return args;
}

function createStreamResponse(): HTTPTransportResponse<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let index = 0; index < 3; index += 1) {
        controller.enqueue(encoder.encode(`${JSON.stringify({ id: index + 1 })}\n`));
      }
      controller.close();
    },
  });

  return {
    status: 200 as StatusCode,
    statusText: "OK",
    headers: { "content-type": "application/json" },
    data: stream,
  };
}

describe("HTTP integration with JSONPlaceholder", () => {
  it("performs a simple GET request", async () => {
    const response = await createClient()
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

    const client = createClient({ plugins: [plugin] })
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

    const response = await createClient()
      .url(JSON_PLACEHOLDER)
      .route("posts")
      .data(payload)
      .post<JsonPlaceholderPost>();

    expect([200, 201]).toContain(response.status);
    expect(response.data).toMatchObject(payload);
    expect(typeof response.data.id).toBe("number");
  });

  it("formats query parameters including repeated array values", async () => {
    const response = await createClient()
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
    const response = await createClient()
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
    const response = await createClient()
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
    const response = await createClient()
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
    const response = await createClient()
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
      const result = await createClient()
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
