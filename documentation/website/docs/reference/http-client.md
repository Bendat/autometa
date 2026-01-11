---
sidebar_position: 8
---

# HTTP Client

The `@autometa/http` package provides a fluent, type-safe HTTP client designed for testing. It includes built-in support for retries, logging, and schema validation.

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
const authPlugin: HTTPPlugin = (client) => {
  client.hook.onRequest((req) => {
    req.headers.set("Authorization", "Bearer " + getToken());
  });
};

const http = HTTP.create({
  plugins: [authPlugin],
});
```
