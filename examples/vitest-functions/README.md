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
