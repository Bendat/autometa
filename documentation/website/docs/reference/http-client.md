---
sidebar_position: 8
---

# HTTP Client

The `@autometa/http` package provides a fluent, type-safe HTTP client designed for testing. It includes built-in support for retries, logging, and schema validation.

## Basic Usage

The `HTTP` class is the entry point. You can configure a shared instance or create one-off requests.

```ts
import { HTTP } from "@autometa/http";

const http = HTTP.create()
  .url("https://api.example.com")
  .sharedOptions({
    headers: { "Authorization": "Bearer token" }
  });

const response = await http.get("/users/1")
  .header("X-Custom", "value")
  .execute();

console.log(response.status); // 200
console.log(response.data);   // { id: 1, name: "Alice" }
```

## Request Building

The fluent API allows you to build requests step-by-step.

### Methods

Supported methods: `get`, `post`, `put`, `patch`, `delete`, `head`, `options`.

```ts
await http.post("/users")
  .body({ name: "Bob" })
  .execute();
```

### Headers & Query Params

```ts
await http.get("/search")
  .param("q", "autometa")
  .param("page", 1)
  .header("Accept", "application/json")
  .execute();
```

### Route Parameters

You can use route parameters in your URL and fill them later.

```ts
await http.get("/users/:id/posts/:postId")
  .routeParam("id", 123)
  .routeParam("postId", 456)
  .execute();
// Request URL: /users/123/posts/456
```

## Response Handling

The `execute()` method returns an `HTTPResponse` object.

```ts
const response = await http.get("/users").execute();

response.status;       // number
response.statusText;   // string
response.headers;      // Headers object
response.data;         // Parsed body (JSON, text, etc.)
```

### Schema Validation

You can validate the response body against a schema. If validation fails, it throws an `HTTPSchemaValidationError`.

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const user = await http.get("/users/1")
  .schema(UserSchema)
  .execute();

// user.data is typed as { id: number, name: string }
```

## Advanced Configuration

### Retries

Configure retry logic for flaky endpoints.

```ts
await http.get("/flaky-endpoint")
  .retry({
    attempts: 3,
    delay: 1000,
    on: [500, 502, 503], // Retry on these status codes
  })
  .execute();
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
