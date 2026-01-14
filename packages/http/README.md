<!-- cspell:disable -->

# @autometa/http

Composable HTTP client utilities with transport adapters, fluent request builders, and batteries-included behaviors (error mapping, retries, logging, streaming).

## Installation

```bash
pnpm add @autometa/http
```

## Quick Start

```ts
import { http } from "@autometa/http";

const client = http().baseUrl("https://api.example.com");

const response = await client
	.get("/users")
	.query({ limit: 25 })
	.execute();

console.log(response.status); // 200
console.log(response.body);   // Parsed JSON payload
```

## Features

- Typed error hierarchy (`HTTPError`, `HTTPTransportError`, `HTTPSchemaValidationError`) with rich metadata
- AbortSignal propagation for cancellable requests
- Configurable retry policies (max attempts, delays, custom retry predicate)
- Scoped timeouts via `sharedTimeout()` / `timeout()` with automatic aborts
- Plugin system with logging hooks (see `createHttpLogger`)
- Streaming responses via `stream()`/`asStream()` without JSON parsing

## Error Handling

Errors thrown by the client expose status, request metadata, and transport details. Catch specific subclasses when you need to branch logic:

```ts
import { HTTPTransportError } from "@autometa/http";

try {
	await http().get("/slow").execute();
} catch (error) {
	if (error instanceof HTTPTransportError) {
		console.error("Transport failure", error.transport);
	}
}
```

## Retries & Delays

```ts
await http()
	.get("/flaky")
	.retry(config =>
		config
			.maxAttempts(3)
			.delay(fn => fn.exponential({ base: 100, max: 2000 }))
			.shouldRetry(({ response }) => response?.status === 503)
	)
	.execute();
```

## Streaming Responses
## Timeouts

Apply timeouts without wiring your own `AbortController`. Timeouts compose with existing signals and respect retries:

```ts
await http()
	.timeout(5000)
	.get();

// combine with a per-request signal
const controller = new AbortController();
await http()
	.timeout(2000)
	.get({ signal: controller.signal });
```

Timeouts use `AbortController` under the hood and can be shared (`sharedTimeout`) or scoped per request.

Set `stream()` when you want the raw response stream. Transports bypass JSON parsing and validation so you can pipe the body directly:

```ts
const stream = await http()
	.get("/events")
	.stream()
	.execute();

for await (const chunk of stream.body) {
	process.stdout.write(chunk);
}
```

## Testing

The package ships with Vitest unit suites and integration tests that exercise the fluent builder against live-like transports. Run everything with:

```bash
pnpm --filter @autometa/http test
```

Integration tests are the recommended place to add coverage for additional transport behaviors (such as verifying streaming support end-to-end).