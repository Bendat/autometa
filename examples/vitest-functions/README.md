# Vitest Functions Example

This package demonstrates how to exercise the Brew Buddy feature catalogue with the Autometa CLI and a custom Vitest-backed step harness.

## Running the feature suite

1. Ensure the Brew Buddy API is running locally (see `examples/.api`).
2. Build the Autometa CLI once so the `autometa` binary is available:
   ```sh
   pnpm --filter @autometa/cli run build
   ```
3. Execute the feature specifications from this package directory:
   ```sh
   pnpm --filter @autometa/examples-vitest-functions exec autometa run
   ```
   The CLI will pick up `autometa.config.ts`, register the Brew Buddy steps, and execute the feature files in `examples/.features`.

Use `pnpm run features` inside this package for a shorthand command.

## Architecture Notes

### World State & Services

The global `BrewBuddyWorld` object is kept lean. Complex state management is delegated to specialized services like `BrewBuddyStreamManager`.

- **BrewBuddyStreamManager**: Handles Server-Sent Events (SSE) connections, buffering events, warnings, and errors. It encapsulates the logic for waiting for specific events or counts, keeping the World object focused on high-level coordination.

### Utilities

- **`src/utils/json.ts`**: Provides robust JSON path resolution and value coercion, used for verifying API response structures.
- **`src/utils/assertions.ts`**: Wraps `@autometa/assertions` to provide domain-specific assertion helpers, such as `requireResponse` and path-based expectations.
- **`src/utils/sse.ts`**: A lightweight SSE client implementation that supports waiting for events and handling stream lifecycle.

### Testing

Unit tests for the utility modules are located in `src/utils/__test__/`. Run them with:

```sh
pnpm test
```

