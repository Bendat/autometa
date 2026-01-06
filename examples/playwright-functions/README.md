# Playwright Functions Example

This example demonstrates using Autometa with Playwright as the test runner.

## Overview

This example uses the functional API (similar to `vitest-functions`) but configured for Playwright instead of Vitest.

## Structure

```
playwright-functions/
├── src/
│   ├── autometa/            # Autometa wiring (composition root, runner surface, parameter types)
│   │   ├── app.ts           # Composition root (DI registrations + world.app wiring)
│   │   ├── steps.ts         # CucumberRunner builder + exported DSL (Given/When/Then/ensure)
│   │   └── parameter-types.ts
│   ├── brew-buddy/          # Domain harness (API facade + scenario-scoped services + capabilities)
│   │   ├── api/             # BrewBuddyClient facade and HTTP helpers
│   │   ├── capabilities/    # Intent-focused services (e.g. MenuService)
│   │   ├── services/        # Scenario-scoped helpers (stream manager, tag registry)
│   │   └── state/           # Scenario memory
│   ├── steps/               # Step definitions (domain + system grouped)
│   │   ├── brew-buddy/      # Domain steps (menu/orders/recipes/requests/tags)
│   │   ├── system/          # Framework/system steps (setup/debug/lifecycle)
│   │   └── index.ts         # Step entrypoint (imports the canonical step modules)
│   ├── utils/               # Shared utilities (assertions, json helpers, regions, SSE)
│   └── world.ts             # World type definitions
├── autometa.config.ts      # Autometa configuration
├── playwright.config.ts    # Playwright configuration
└── package.json
```

### Conventions used in this example

- **All Autometa “wiring” lives under `src/autometa/*`** so test authors can ignore framework setup.
- **Domain interactions live under `src/brew-buddy/*`** (API facade, scenario services, and capability services).
- **Steps are grouped by intent** under `src/steps/{system,brew-buddy}/*`.

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
      steps: ["./src/steps", "./src/autometa/steps.ts"],
      parameterTypes: ["./src/autometa/parameter-types.ts"],
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

- This example uses the `@autometa/playwright-loader` package for `.feature` file transformation.
- Feature files are shared with other examples via `../.features`.
