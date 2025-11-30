# Playwright Functions Example

This example demonstrates using Autometa with Playwright as the test runner.

## Overview

This example uses the functional API (similar to `vitest-functions`) but configured for Playwright instead of Vitest.

## Structure

```
playwright-functions/
├── src/
│   ├── composition/         # DI composition root
│   ├── services/           # Application services
│   ├── steps/              # Step definitions
│   ├── support/            # Parameter types
│   ├── utils/              # Utilities (HTTP client, assertions, etc.)
│   ├── step-definitions.ts # CucumberRunner builder
│   └── world.ts            # World type definitions
├── autometa.config.ts      # Autometa configuration
├── playwright.config.ts    # Playwright configuration
└── package.json
```

## Running Tests

### Prerequisites

1. Start the example API server:
   ```bash
   pnpm dev:examples:api
   ```

2. Install Playwright browsers (first time only):
   ```bash
   npx playwright install
   ```

### Run Tests

```bash
# Run all feature tests
pnpm features

# Run with UI mode (interactive)
pnpm features:ui

# List all tests without running
pnpm test:list
```

### Using the Orchestrator

From the workspace root:

```bash
# Auto-detect Playwright and run
pnpm autometa run

# With watch mode (opens Playwright UI)
pnpm autometa run --watch
```

## Configuration

### autometa.config.ts

```typescript
import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "playwright",
    roots: {
      features: ["../.features"],
      steps: ["./src/steps", "./src/step-definitions.ts"],
    },
  },
});
```

### playwright.config.ts

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "../.features",
  testMatch: "**/*.feature",
  // ...
});
```

## Notes

- This example uses the `@autometa/playwright-loader` package for .feature file transformation
- The loader is currently scaffolded - full step execution integration is in progress
- Feature files are shared with other examples via `../.features`
