---
sidebar_position: 8
---

# HTTP Client

The `@autometa/http` package provides a fluent, type-safe HTTP client designed for testing. It includes built-in support for retries, logging, and schema validation. Most fluent calls *derive a narrower client* (a new `HTTP` instance with additional scope), while `shared*` calls mutate the current instance.

## Derivable (Recursive) Client Model

Think of `HTTP` as a “recursive builder”: each call produces a more specific client that carries forward everything configured so far (base URL, route segments, headers, params, retry policy, hooks, schema rules, etc).

- **Derived calls** (e.g. `route`, `header`, `param`, `retry`, `schema`) return a new client and do not affect the original.
- **Shared calls** (e.g. `sharedRoute`, `sharedHeader`, `sharedParams`, `sharedRetry`) mutate the current instance and affect all future derived clients.

This makes it natural to create a shared “API root” once, then derive “endpoint clients” per use case:

```ts
const api = HTTP.create()
	.url("https://api.example.com")
	.sharedHeaders({ Authorization: "Bearer token" })
	.sharedRetry({ attempts: 3, delay: 250 });

const users = api.route("users");        // derived
const adminUsers = users.header("X-Role", "admin"); // derived

await adminUsers.get();
```

## Basic Usage

The `HTTP` class is the entry point. Configure a shared instance and then compose requests with `.route(...)`, `.param(...)`, `.header(...)`, etc.

```ts
import { HTTP } from "@autometa/http";

const http = HTTP.create()
	.url("https://api.example.com")
	.sharedOptions({
		headers: { Authorization: "Bearer token" },
	});

const response = await http
	.route("users", 1)
	.header("X-Custom", "value")
	.get();

console.log(response.status); // 200
console.log(response.data); // { id: 1, name: "Alice" }
```

## Request Building

The fluent API allows you to build requests step-by-step.

### Methods

Supported methods: `get`, `post`, `put`, `patch`, `delete`, `head`, `options`.

```ts
await http.route("users").data({ name: "Bob" }).post();
```

### Headers & Query Params

```ts
await http
	.route("search")
	.param("q", "autometa")
	.param("page", 1)
	.header("Accept", "application/json")
	.get();
```

### Query Serialization (Arrays + Objects)

Query params are serialized by Autometa (via `URLSearchParams`) before the request hits the transport, so the behaviour is consistent across Fetch and Axios.

Use `sharedQueryFormat(...)` to set defaults for a client subtree, or `queryFormat(...)` for a derived one-off:

```ts
const api = HTTP.create()
	.url("https://api.example.com")
	.sharedQueryFormat({ arrayFormat: "brackets", objectFormat: "dot" });

await api
	.route("items")
	.param("tags", ["a", "b"])
	.param("filter", { owner: "me" })
	.get();
// => ?tags[]=a&tags[]=b&filter.owner=me
```

If you need a specific standard (e.g. a backend expecting `qs`-style output), provide a custom `serializer`:

```ts
api.sharedQueryFormat({
  serializer: (params) => new URLSearchParams({ ...params } as never).toString(),
});
```

### Routes

Build URLs by appending route segments. Each segment is URL-joined safely with the base URL set via `.url(...)`.

```ts
await http.route("users", 123, "posts", 456).get();
// Full URL: https://api.example.com/users/123/posts/456
```

## Response Handling

Each method returns an `HTTPResponse` object.

```ts
const response = await http.route("users").get();

response.status;       // number
response.statusText;   // string
response.headers;      // Record<string, string> (lowercased keys)
response.data;         // Parsed body (JSON, text, etc.)
```

### Schema Validation

You can validate the response body against a schema for specific status codes (or ranges). If validation fails, it throws an `HTTPSchemaValidationError`.

```ts
import { z } from "zod";

const UserSchema = z.object({
	id: z.number(),
	name: z.string(),
});

const user = await http
	.route("users", 1)
	.schema(UserSchema, 200)
	.get();

// user.data is typed as { id: number, name: string }
```

## Advanced Configuration

### Retries

Configure retry logic for flaky endpoints.

```ts
await http
	.route("flaky-endpoint")
	.retry({
		attempts: 3,
		delay: 1000,
		retryOn: ({ response }) =>
			[500, 502, 503].includes(response?.status ?? 0),
	})
	.get();
```

### Logging

Enable logging to see request and response details in the console.

```ts
// autometa.config.ts
export default defineConfig({
  default: {
    logging: {
      http: true,
    },
  },
});
```

### Plugins

Extend the client with plugins to add custom behavior (e.g., authentication, logging).

```ts
import { HTTP, type HTTPPlugin } from "@autometa/http";

const authPlugin: HTTPPlugin = {
	name: "auth",
	onRequest({ request }) {
		request.headers.authorization = `Bearer ${getToken()}`;
	},
};

const http = HTTP.create({
	plugins: [authPlugin],
});
```

### Streaming Responses

If you need the raw response body (stream) rather than parsed JSON/text, enable streaming:

```ts
const response = await http.asStream().get();
// response.data is the raw stream (transport-dependent)
```

### Transports

By default, `HTTP.create()` uses a Fetch-based transport. You can swap in an Axios transport when you need Node stream semantics or want to share an existing Axios instance:

```ts
import axios from "axios";
import { HTTP, createAxiosTransport } from "@autometa/http";

const http = HTTP.create({
	transport: createAxiosTransport(axios),
});
```

### HTTP Logs + Autometa Events

You can pair HTTP logging with Autometa test events (see [Events](./events.md)) to create richer reporting.
If your runner executes scenarios concurrently, prefer storing logs on the world/app instead of a single global `activeScenarioId`.

```ts
import { createLoggingPlugin, type HTTPLogEvent, HTTP } from "@autometa/http";
import { registerTestListener } from "@autometa/events";

let activeScenarioId: string | undefined;
const logsByScenario = new Map<string, HTTPLogEvent[]>();

HTTP.registerSharedPlugin(createLoggingPlugin((event) => {
	if (!activeScenarioId) {
		return;
	}
	const logs = logsByScenario.get(activeScenarioId) ?? [];
	logs.push(event);
	logsByScenario.set(activeScenarioId, logs);
}));

registerTestListener({
	onScenarioStarted({ event }) {
		activeScenarioId = event.scenario.id;
		logsByScenario.set(activeScenarioId, []);
	},
	onScenarioCompleted({ event }) {
		const logs = logsByScenario.get(event.scenario.id) ?? [];
		console.log(`[http] ${event.scenario.name}`, logs);
		activeScenarioId = undefined;
	},
});
```
